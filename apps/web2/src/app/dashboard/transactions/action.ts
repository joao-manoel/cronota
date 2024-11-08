'use server'
import { format } from 'date-fns'
import { HTTPError } from 'ky'
import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'

import { createTransaction } from '@/http/create-transaction'
import { deleteTransactions } from '@/http/delete-transactions'
import { updatePaymentTransactions } from '@/http/update-payment-transactions'

const createIncomeActionSchema = z.object({
  title: z.string().min(3, 'Titulo tem que ter no minino 3 caracteres.'),
  amount: z
    .string()
    .transform((value) => {
      // Remove "R$" e qualquer espaço em branco, em seguida, substitui "," por "."
      const numericValue = parseFloat(
        value.replace(/[R$\s]/g, '').replace(',', '.'),
      )
      return numericValue
    })
    .refine((value) => value > 0, {
      message: 'O valor deve ser positivo.',
    }),
  categoryId: z.string(),
  type: z.enum(['INCOME', 'EXPENSE']),
  payDate: z.string(),
  cardId: z.string(),
  recurrence: z.enum(['VARIABLE', 'MONTH', 'YEAR']).optional(),
  installments: z.string().optional(),
})

function createInstallmentsArray(
  numInstallments: string,
  payDate: string,
): Array<{
  installment: number
  status: 'pending' | 'paid' // ou outros estados que você definiu
  payDate: string
  paidAt?: string
}> {
  const installmentsArray = []
  const totalInstallments = parseInt(numInstallments, 10)

  const baseDate = new Date(payDate)

  for (let i = 1; i <= totalInstallments; i++) {
    const installmentDate = new Date(baseDate)
    if (i > 1) {
      installmentDate.setMonth(baseDate.getMonth() + i - 1)
    }

    installmentsArray.push({
      installment: i,
      status: 'pending' as 'pending' | 'paid',
      payDate: format(installmentDate, 'yyyy-MM-dd'),
    })
  }

  return installmentsArray
}

export async function createIncomeAction(data: FormData) {
  const result = createIncomeActionSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors

    return { success: false, message: null, errors }
  }

  const {
    title,
    amount,
    categoryId,
    payDate,
    cardId,
    recurrence,
    installments,
    type,
  } = result.data

  const walletId = cookies().get('wallet')?.value

  if (!walletId) {
    return {
      success: false,
      message:
        'Você precisa ter uma carteira ativa para realizar essa operação.',
      errors: null,
    }
  }

  try {
    const transaction = await createTransaction({
      walletId,
      title,
      amount: amount * 100,
      type,
      payDate,
      ...(recurrence ? { recurrence } : { recurrence: 'VARIABLE' }),
      categoryId,
      cardId,
      status: 'pending',
      ...(installments && {
        installments: createInstallmentsArray(installments, payDate),
      }),
    })

    revalidateTag(`${walletId}/transactions`)

    if (transaction) {
      return {
        success: true,
        message: `Receita ${title} criada com sucesso!`,
        errors: null,
      }
    }

    return {
      success: false,
      message: `Não foi possível criar a receita ${title}. Tente novamente.`,
      errors: null,
    }
  } catch (err) {
    if (err instanceof HTTPError) {
      const { message } = await err.response.json()

      return { success: false, message, errors: null }
    }

    return {
      success: false,
      message: 'Unexpected error, try again in a few minutes.',
      errors: null,
    }

    return { success: false, message: null, errors: null }
  }
}

interface DeleteTransactionActionProps {
  walletId: string
  transactions: Array<string>
}

export async function deleteTransactionAction({
  walletId,
  transactions,
}: DeleteTransactionActionProps) {
  await deleteTransactions({
    walletId,
    transactions,
  })

  revalidateTag(`${walletId}/transactions`)
}

interface UpdatePaymentTransactionsActionProps {
  walletId: string
  transactions: Array<{
    id: string
    recurrence: 'VARIABLE' | 'MONTH' | 'YEAR'
    status?: 'paid' | 'pending'
    payDate: string
    paidAt?: string
    installments?: Array<{
      id: string
    }>
  }>
}

export async function updatePaymentTransactionsAction({
  walletId,
  transactions,
}: UpdatePaymentTransactionsActionProps) {
  updatePaymentTransactions({
    walletId,
    transactions,
  })

  revalidateTag(`${walletId}/transactions`)
}