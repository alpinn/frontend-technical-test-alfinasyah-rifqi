import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useBlocker } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { useFieldArray, useForm, useFormContext, useWatch, type Path } from 'react-hook-form'
import { z } from 'zod'

import { ApiRequestError } from '@/api/client'
import { productsQuery, warehousesQuery } from '@/api/reference'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Icon } from '@/components/icon'
import { ErrorState, SkeletonRows } from '@/components/state-panels'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { CreatePurchaseRequestInput, Product, PurchaseRequest } from '@/types'

const itemSchema = z.object({
  productId: z.string().min(1, 'Select a product.'),
  quantity: z
    .number({ error: 'Enter a quantity.' })
    .int('Quantity must be a whole number.')
    .gt(0, 'Quantity must be greater than 0.'),
})

const purchaseRequestSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required.'),
  items: z
    .array(itemSchema)
    .min(1, 'Add at least one product.')
    .superRefine((items, context) => {
      const seen = new Set<string>()
      items.forEach((item, index) => {
        if (item.productId && seen.has(item.productId)) {
          context.addIssue({
            code: 'custom',
            message: 'Product has already been added.',
            path: [index, 'productId'],
          })
        }
        seen.add(item.productId)
      })
    }),
  notes: z.string().max(500, 'Notes must be 500 characters or fewer.'),
})

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestSchema>

function ItemRow({
  index,
  products,
  takenProductIds,
  onRemove,
}: {
  index: number
  products: Product[]
  takenProductIds: Set<string>
  onRemove: () => void
}) {
  const form = useFormContext<PurchaseRequestFormValues>()
  const productId = useWatch({ control: form.control, name: `items.${index}.productId` })
  const product = products.find((entry) => entry.id === productId)
  const position = index + 1

  return (
    <div className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-start">
      <FormField
        control={form.control}
        name={`items.${index}.productId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Product <span className="sr-only">{position}</span>
            </FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full" onBlur={field.onBlur}>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
              </FormControl>
              <SelectContent position="popper">
                {products.map((option) => {
                  const taken = takenProductIds.has(option.id) && option.id !== field.value
                  return (
                    <SelectItem key={option.id} value={option.id} disabled={taken}>
                      {option.name} · {option.sku}
                      {taken ? ' (already added)' : ''}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`items.${index}.quantity`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Quantity <span className="sr-only">{position}</span>
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={Number.isNaN(field.value) ? '' : field.value}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === '' ? Number.NaN : event.target.valueAsNumber,
                    )
                  }
                  className={cn(product && 'pr-12')}
                />
              </FormControl>
              {product ? (
                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-2xs font-medium text-dark-light-active">
                  {product.unit}
                </span>
              ) : null}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="justify-self-end sm:mt-5"
        onClick={onRemove}
        aria-label={product ? `Remove ${product.name}` : `Remove item ${position}`}
      >
        <Icon icon={Trash2} />
      </Button>
    </div>
  )
}

export function PurchaseRequestForm({
  defaultValues,
  submitLabel,
  pendingLabel,
  save,
  onSaved,
  cancel,
}: {
  defaultValues: PurchaseRequestFormValues
  submitLabel: string
  pendingLabel: string
  save: (input: CreatePurchaseRequestInput) => Promise<PurchaseRequest>
  onSaved: (request: PurchaseRequest) => void
  cancel: ReactNode
}) {
  const warehouses = useQuery(warehousesQuery)
  const products = useQuery(productsQuery)
  const leaving = useRef(false)

  const form = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues,
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const items = useWatch({ control: form.control, name: 'items' })
  const { isDirty, isSubmitting, errors } = form.formState

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty && !leaving.current,
    enableBeforeUnload: () => isDirty && !leaving.current,
    withResolver: true,
  })

  if (warehouses.isPending || products.isPending) {
    return (
      <Card>
        <SkeletonRows rows={6} />
      </Card>
    )
  }

  if (warehouses.isError || products.isError) {
    return (
      <Card>
        <ErrorState
          title="Unable to load warehouses and products"
          description="The form needs both lists before a request can be created."
          onRetry={() => {
            void warehouses.refetch()
            void products.refetch()
          }}
        />
      </Card>
    )
  }

  const productList = products.data
  const takenProductIds = new Set(items.map((item) => item.productId).filter(Boolean))
  const itemsError = errors.items?.message ?? errors.items?.root?.message
  const serverError = errors.root?.server?.message

  async function submit(values: PurchaseRequestFormValues) {
    try {
      const saved = await save({
        warehouseId: values.warehouseId,
        notes: values.notes.trim() || undefined,
        items: values.items,
      })
      leaving.current = true
      onSaved(saved)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          form.setError(field as Path<PurchaseRequestFormValues>, { message })
        }
      }
      form.setError('root.server', {
        message:
          error instanceof ApiRequestError
            ? error.message
            : 'Something went wrong while saving. Please try again.',
      })
    }
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={(event) => void form.handleSubmit(submit)(event)}>
        <fieldset disabled={isSubmitting} className="space-y-3">
          <Card>
            <CardHeader className="border-b">
              <div>
                <CardTitle>Request details</CardTitle>
                <CardDescription>Where the requested stock should be delivered.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full" onBlur={field.onBlur}>
                          <SelectValue placeholder="Select a warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {warehouses.data.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the receiving warehouse.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Add request notes..." />
                    </FormControl>
                    <FormDescription>Optional. Visible to the approving manager.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <div>
                <CardTitle>Items</CardTitle>
                <CardDescription>Each product can be added once.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: '', quantity: 1 })}
                disabled={fields.length >= productList.length}
              >
                <Icon icon={Plus} />
                Add Product
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.length === 0 ? (
                <p className="py-6 text-center text-xs text-dark-normal">
                  No products added yet. Use Add Product to start the request.
                </p>
              ) : null}
              {fields.map((field, index) => (
                <ItemRow
                  key={field.id}
                  index={index}
                  products={productList}
                  takenProductIds={takenProductIds}
                  onRemove={() => remove(index)}
                />
              ))}
              {itemsError ? (
                <p role="alert" className="text-2xs text-danger-fg">
                  {itemsError}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {serverError ? (
            <div
              role="alert"
              className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs text-danger-fg"
            >
              {serverError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {cancel}
            <Button type="submit">{isSubmitting ? pendingLabel : submitLabel}</Button>
          </div>
        </fieldset>
      </form>

      <ConfirmDialog
        open={blocker.status === 'blocked'}
        onOpenChange={(open) => (open ? undefined : blocker.reset?.())}
        title="Discard unsaved changes?"
        description="This purchase request has changes that have not been saved. Leaving now will discard them."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => blocker.proceed?.()}
      />
    </Form>
  )
}
