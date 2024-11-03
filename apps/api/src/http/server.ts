import { env } from '@cro/env'
import fastifyCors from '@fastify/cors'
import { fastifyJwt } from '@fastify/jwt'
import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { authenticateWithGoogle } from './routes/auth/authenticate-with-google'
import { createAccount } from './routes/auth/create-account'
import { getProfile } from './routes/auth/get-profile'
import { createWallet } from './routes/financial/personal/wallet/create-wallet'
import { deleteWallet } from './routes/financial/personal/wallet/delete-wallet'
import { getWallets } from './routes/financial/personal/wallet/get-wallets'
import { deleteTransaction } from './routes/financial/personal/wallet/transactions/delete-transactions'
import { getTransactions } from './routes/financial/personal/wallet/transactions/get-transactions'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors)

app.register(createAccount)
app.register(authenticateWithGoogle)
app.register(getProfile)

app.register(getWallets)
app.register(createWallet)
app.register(deleteWallet)

app.register(getTransactions)
app.register(deleteTransaction)

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log(`🔥 Server listening on ${env.SERVER_PORT}`)
})