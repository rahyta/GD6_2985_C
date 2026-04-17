import { createDatabaseErrorResponse, getSql } from '../lib/db';

type QueryInvoice = {
  amount: number;
  name: string;
};

async function listInvoices() {
  const sql = getSql();

  const data = await sql<QueryInvoice[]>`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

  return data;
}

export async function GET() {
  try {
    return Response.json(await listInvoices());
  } catch (error) {
    return createDatabaseErrorResponse(error);
  }
}
