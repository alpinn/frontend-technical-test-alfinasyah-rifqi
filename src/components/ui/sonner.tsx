import { Toaster as Sonner, type ToasterProps } from 'sonner'

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group rounded-lg border border-line bg-dark-active text-surface-white shadow-overlay text-xs',
          description: 'text-dark-lighter',
          actionButton: 'bg-blue-normal text-surface-white',
          cancelButton: 'bg-dark-normal text-surface-white',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
