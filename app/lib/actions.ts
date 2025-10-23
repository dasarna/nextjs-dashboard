'use server';

import {z} from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
//import { error } from 'console';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object ({
    id: z.string(),
    customerId: z.string(
      {invalid_type_error: 'Please select a customer.'},
    ),
    amount: z.coerce.number().gt(0,{message:'Please enter an amount greater than $0.'}),
    status: z.enum(['pending','paid'], {
      invalid_type_error:'Please select an invoice status.',
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id:true,date:true});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice (prevState:State,formData:FormData) {

    const validatedFields = CreateInvoice.safeParse ({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
    }

    const {customerId,amount,status} = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    //console.log(rawFormData);

    try {
      await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
      console.log(error);
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({id:true, date:true});

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
 
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.log(error);
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice (id: string) {
  //throw new Error('Failed to delete invoice ...');
  
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const redirectTo = formData.get('redirectTo') as string;

    // Perform sign-in
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false, // Handle redirect manually
    });

    // If sign-in is successful, fetch user role to determine redirect
    if (result?.error) {
      return 'Invalid credentials';
    }

    // Fetch user to get role
    const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
    const user = await sql`SELECT role FROM users WHERE email=${email}`;
    const role = user[0]?.role || 'web_user';
    await sql.end(); // Close the connection

    // Determine redirect based on role
    const redirectUrl = role === 'admin' ? '/admin' : '/dashboard';

    // Return redirect URL
    return { redirectTo: redirectUrl };
  } catch (error) {
    console.error('Authenticate error:', error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials';
        default:
          return 'Something went wrong';
      }
    }
    return 'Database error';
  }
}
