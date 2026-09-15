import { zodResolver } from '@hookform/resolvers/zod'
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useFieldArray, useForm, type Path } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiRequestError } from '@/api/client'
import {
  purchaseOrderKeys,
  purchaseOrderQuery,
  receiveGoods,
  syncPurchaseOrderCaches,
} from '@/api/purchase-orders'
import { ErrorState, SkeletonRows } from '@/components/state-panels'
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
import { Input } from '@/components/ui/input'
import { remainingQuantity } from '@/lib/purchase-order'
import type { PurchaseOrder, ReceiveGoodsInput } from '@/types'

type ReceiptValues = { lines: { productId: string; quantity: number }[] }

const receiveMutationKey = (orderId: string) => ['receive-goods', orderId]

function receiptSchema(order: PurchaseOrder) {
  const remainingByProduct = new Map(
    order.items.map((item) => [item.product.id, remainingQuantity(item)]),
  )

  return z.object({
    lines: z
      .array(
        z.object({
          productId: z.string(),
          quantity: z.custom<number>((value) => typeof value === 'number'),
        }),
      )
      .superRefine((lines, context) => {
        lines.forEach((line, index) => {
          if (Number.isNaN(line.quantity)) return
          const remaining = remainingByProduct.get(line.productId) ?? 0
          if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
            context.addIssue({
              code: 'custom',
              message: 'Receive quantity must be greater than 0.',
              path: [index, 'quantity'],
            })
          } else if (line.quantity > remaining) {
            context.addIssue({
              code: 'custom',
              message: `Cannot receive more than ${remaining} remaining.`,
              path: [index, 'quantity'],
            })
          }
        })
        if (lines.every((line) => Number.isNaN(line.quantity))) {
          context.addIssue({
            code: 'custom',
            message: 'Enter a receive quantity for at least one product.',
          })
        }
      }),
  })
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xs text-dark-normal">{label}</p>
      <p className="mt-1 text-sm font-medium text-dark-active tabular-nums">
        {value.toLocaleString('en-US')}
      </p>
    </div>
  )
}

function ReceiptForm({ order, onClose }: { order: PurchaseOrder; onClose: () => void }) {
  const queryClient = useQueryClient()
  const receivable = order.items.filter((item) => remainingQuantity(item) > 0)
  const fullyReceivedItems = order.items.filter((item) => remainingQuantity(item) === 0)
  const [review, setReview] = useState<ReceiveGoodsInput['lines'] | null>(null)

  const form = useForm<ReceiptValues>({
    resolver: zodResolver(receiptSchema(order)),
    defaultValues: {
      lines: receivable.map((item) => ({ productId: item.product.id, quantity: Number.NaN })),
    },
  })
  const { fields } = useFieldArray({ control: form.control, name: 'lines' })

  const receive = useMutation({
    mutationKey: receiveMutationKey(order.id),
    mutationFn: (input: ReceiveGoodsInput) => receiveGoods(order.id, input),
    onSuccess: async (updated) => {
      toast.success(
        updated.status === 'RECEIVED'
          ? `${updated.orderNumber} is fully received.`
          : `Goods received for ${updated.orderNumber}.`,
      )
      onClose()
      await syncPurchaseOrderCaches(queryClient, updated)
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.status === 422) {
        setReview(null)
        const lines = form.getValues('lines')
        for (const [key, message] of Object.entries(error.fieldErrors)) {
          const index = lines.findIndex((line) => line.productId === key)
          const field = index >= 0 ? `lines.${index}.quantity` : 'lines'
          form.setError(field as Path<ReceiptValues>, { message })
        }
        return
      }
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : 'Something went wrong. Please try again.',
      )
      if (error instanceof ApiRequestError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(order.id) })
        onClose()
      }
    },
  })

  if (review) {
    const willBeFullyReceived = order.items.every((item) => {
      const line = review.find((entry) => entry.productId === item.product.id)
      return item.receivedQuantity + (line?.quantity ?? 0) >= item.orderedQuantity
    })

    return (
      <>
        <DialogBody className="space-y-3">
          <DialogDescription>
            Check the quantities before recording. Stock in {order.warehouse.name} increases as soon
            as the receipt is recorded.
          </DialogDescription>
          <ul
            aria-label="Receipt summary"
            className="divide-y divide-line rounded-lg border border-line"
          >
            {review.map((line) => {
              const item = order.items.find((entry) => entry.product.id === line.productId)
              if (!item) return null
              return (
                <li
                  key={line.productId}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <span className="text-xs font-medium text-dark-active">{item.product.name}</span>
                  <span className="text-xs text-dark-normal tabular-nums">
                    +{line.quantity.toLocaleString('en-US')} {item.product.unit} ·{' '}
                    {(remainingQuantity(item) - line.quantity).toLocaleString('en-US')} still to
                    arrive
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-dark-normal">
            After this receipt the order will be{' '}
            <strong className="font-medium text-dark-active">
              {willBeFullyReceived ? 'fully received' : 'partially received'}
            </strong>
            .
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReview(null)} disabled={receive.isPending}>
            Back
          </Button>
          <Button onClick={() => receive.mutate({ lines: review })} disabled={receive.isPending}>
            {receive.isPending ? 'Recording...' : 'Record Receipt'}
          </Button>
        </DialogFooter>
      </>
    )
  }

  const linesError =
    form.formState.errors.lines?.message ?? form.formState.errors.lines?.root?.message

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={(event) =>
          void form.handleSubmit((values) =>
            setReview(values.lines.filter((line) => !Number.isNaN(line.quantity))),
          )(event)
        }
      >
        <DialogBody className="max-h-[60vh] space-y-3 overflow-y-auto">
          <DialogDescription>
            Enter what arrived in this delivery. Leave a product empty if none of it arrived.
          </DialogDescription>
          {fields.map((field, index) => {
            const item = receivable[index]
            return (
              <div key={field.id} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-dark-active">{item.product.name}</p>
                  <p className="text-2xs text-dark-light-active">
                    {item.product.sku} · {item.product.unit}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_9rem] sm:items-start">
                  <Figure label="Ordered" value={item.orderedQuantity} />
                  <Figure label="Already Received" value={item.receivedQuantity} />
                  <Figure label="Remaining" value={remainingQuantity(item)} />
                  <FormField
                    control={form.control}
                    name={`lines.${index}.quantity`}
                    render={({ field: input }) => (
                      <FormItem className="col-span-3 sm:col-span-1">
                        <FormLabel>
                          Receive Now <span className="sr-only">for {item.product.name}</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={remainingQuantity(item)}
                            step={1}
                            placeholder="0"
                            name={input.name}
                            ref={input.ref}
                            onBlur={input.onBlur}
                            value={Number.isNaN(input.value) ? '' : input.value}
                            onChange={(event) =>
                              input.onChange(
                                event.target.value === '' ? Number.NaN : event.target.valueAsNumber,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )
          })}
          {linesError ? (
            <p role="alert" className="text-2xs text-danger-fg">
              {linesError}
            </p>
          ) : null}
          {fullyReceivedItems.length > 0 ? (
            <p className="text-2xs text-dark-light-active">
              Already fully received:{' '}
              {fullyReceivedItems.map((item) => item.product.name).join(', ')}.
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Review Receipt</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export function ReceiveGoodsDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const query = useQuery({ ...purchaseOrderQuery(orderId), enabled: open && Boolean(orderId) })
  const isRecording = useIsMutating({ mutationKey: receiveMutationKey(orderId) }) > 0

  function renderBody() {
    if (query.isPending) {
      return (
        <DialogBody>
          <DialogDescription className="sr-only">Loading the purchase order.</DialogDescription>
          <SkeletonRows rows={3} />
        </DialogBody>
      )
    }
    if (query.isError) {
      return (
        <DialogBody>
          <DialogDescription className="sr-only">
            The purchase order could not be loaded.
          </DialogDescription>
          <ErrorState
            title="Unable to load this purchase order"
            description="Something went wrong while retrieving the order."
            onRetry={() => void query.refetch()}
          />
        </DialogBody>
      )
    }
    return (
      <ReceiptForm key={query.data.id} order={query.data} onClose={() => onOpenChange(false)} />
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (isRecording ? undefined : onOpenChange(next))}>
      <DialogContent showCloseButton={!isRecording} className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {query.data ? `Receive Goods — ${query.data.orderNumber}` : 'Receive Goods'}
          </DialogTitle>
        </DialogHeader>
        {renderBody()}
      </DialogContent>
    </Dialog>
  )
}
