import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiRequestError } from '@/api/client'
import {
  purchaseRequestKeys,
  rejectPurchaseRequest,
  syncPurchaseRequestCaches,
} from '@/api/purchase-requests'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import type { PurchaseRequest } from '@/types'

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Rejection reason is required.')
    .max(500, 'Keep the reason under 500 characters.'),
})

type RejectValues = z.infer<typeof rejectSchema>

export function RejectRequestDialog({
  request,
  open,
  onOpenChange,
}: {
  request: PurchaseRequest
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  })

  const reject = useMutation({
    mutationFn: (reason: string) => rejectPurchaseRequest(request.id, reason),
    onSuccess: async (updated) => {
      form.reset()
      onOpenChange(false)
      toast.success(`${updated.requestNumber} rejected.`)
      await syncPurchaseRequestCaches(queryClient, updated)
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.fieldErrors.reason) {
        form.setError('reason', { message: error.fieldErrors.reason })
        return
      }
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : 'Something went wrong. Please try again.',
      )
      if (error instanceof ApiRequestError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.detail(request.id) })
      }
    },
  })

  function changeOpen(next: boolean) {
    if (reject.isPending) return
    if (!next) form.reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent showCloseButton={!reject.isPending}>
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit((values) => reject.mutate(values.reason))}>
            <DialogHeader>
              <DialogTitle>Reject Purchase Request?</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-3">
              <DialogDescription>
                {request.requestNumber} will move to Rejected. The requester will see the reason you
                give.
              </DialogDescription>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection reason</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Explain why this request cannot be approved"
                        disabled={reject.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => changeOpen(false)}
                disabled={reject.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={reject.isPending}>
                {reject.isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
