import postgres, { type Sql } from 'postgres';

const LOCAL_DATABASE_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export class DatabaseConfigError extends Error {
  code = 'DATABASE_NOT_CONFIGURED';

  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigError';
  }
}

let sqlClient: Sql | undefined;

function getDatabaseUrl() {
  const databaseUrl = process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new DatabaseConfigError(
      'POSTGRES_URL is not configured. Add a Postgres connection string in Vercel project settings before using database routes.',
    );
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    if (
      process.env.VERCEL === '1' &&
      LOCAL_DATABASE_HOSTS.has(parsedUrl.hostname)
    ) {
      throw new DatabaseConfigError(
        'POSTGRES_URL points to a local database host. Vercel deployments need a public Postgres connection string.',
      );
    }
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      throw error;
    }
  }

  return databaseUrl;
}

export function getSql() {
  if (!sqlClient) {
    sqlClient = postgres(getDatabaseUrl(), { ssl: 'require' });
  }

  return sqlClient;
}

export function createDatabaseErrorResponse(error: unknown) {
  if (error instanceof DatabaseConfigError) {
    return Response.json(
      {
        code: error.code,
        error: error.message,
      },
      { status: 503 },
    );
  }

  console.error('Database Error:', error);

  return Response.json(
    {
      code: 'DATABASE_REQUEST_FAILED',
      error: 'Database request failed.',
    },
    { status: 500 },
  );
}
