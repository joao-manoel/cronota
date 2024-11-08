import { ExternalLink, Trash2, Wallet } from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getWallets } from '@/http/get-wallets'
import { transformTypeWalletText } from '@/utils/format'

import { deletePersonalWalletAction } from './action'

export default async function WalletList() {
  const walletId = cookies().get('wallet')?.value
  const wallets = await getWallets()

  return (
    <div className="space-y-2">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Carteiras</h2>
        <Button size="sm" variant="secondary" asChild>
          <Link href="/dashboard/settings/wallets/create">Nova carteira</Link>
        </Button>
      </header>

      <div className="rounded border">
        <Table>
          <TableBody>
            {wallets.map((wallet) => {
              return (
                <TableRow key={wallet.id}>
                  <TableCell className="py-2.5" style={{ width: 48 }}>
                    <Wallet />
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-2 font-medium">
                        {wallet.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transformTypeWalletText(wallet.type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      {walletId === wallet.id && (
                        <Button variant="ghost" disabled={true}>
                          <span className="h-2 w-2 animate-ping rounded-full bg-green-400" />
                          Ativo
                        </Button>
                      )}

                      {walletId !== wallet.id && (
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`/dashboard/settings/wallets/select/${wallet.id}`}
                          >
                            <ExternalLink />
                            Visualizar
                          </a>
                        </Button>
                      )}

                      {walletId !== wallet.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 />
                              Deletar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Deletar carteira {wallet.name}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não poderá ser desfeita. Ela irá
                                excluir permanentemente sua carteira.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                asChild
                                className="bg-transparent p-0 hover:bg-transparent"
                              >
                                <form
                                  action={deletePersonalWalletAction.bind(
                                    null,
                                    wallet.id,
                                  )}
                                >
                                  <Button
                                    variant="destructive"
                                    type="submit"
                                    className="w-full"
                                  >
                                    Deletar
                                  </Button>
                                </form>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}