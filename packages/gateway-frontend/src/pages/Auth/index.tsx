import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStores } from '@/stores'
import { observer } from 'mobx-react-lite'
import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import client, { validateCookie } from '@/libs/http'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const formSchema = z.object({
  accessToken: z.string().nonempty({
    message: 'Access Token 不能为空',
  }),
})

const Page = () => {
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const stores = useStores()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accessToken: '',
    },
  })

  const onSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      await client
        .post('/api/auth', {
          accessToken: values.accessToken,
        })
        .catch((err) => {
          enqueueSnackbar('授权失败', { variant: 'error' })

          form.control.setError('accessToken', {
            type: 'custom',
            message: '授权失败：' + err.message,
          })

          throw err
        })
        .then(() => {
          return validateCookie().then((user) => {
            if (user.accessToken) {
              stores.config.updateConfig({
                accessToken: user.accessToken,
              })
            }

            if (user.viewerToken) {
              stores.config.updateConfig({
                viewerToken: user.viewerToken,
              })
            }

            navigate('/', { replace: true })
          })
        })
        .catch((err) => {
          console.error(err)
        })
    },
    [enqueueSnackbar, form.control, navigate, stores.config]
  )

  const onSubmitError = useCallback((errors: any) => {
    console.error(errors)
  }, [])

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>登录</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onSubmitError)}
              className="space-y-8"
            >
              <FormField
                control={form.control}
                name="accessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                登录
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default observer(Page)
