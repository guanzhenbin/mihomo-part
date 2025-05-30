import { Button } from '@heroui/react'
import type { ReactNode, JSX } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { useTranslation } from 'react-i18next'

const ErrorFallback = ({ error }: FallbackProps): JSX.Element => {
  const { t } = useTranslation()
  
  return (
    <div className="p-4">
      <h2 className="my-2 text-lg font-bold">
        {t('common.error.appCrash')}
      </h2>

      <Button
        size="sm"
        color="primary"
        variant="flat"
        onPress={() => open('https://github.com/mihomo-party-org/mihomo-party/issues/new/choose')}
      >
        GitHub
      </Button>
      <Button
        size="sm"
        color="primary"
        variant="flat"
        className="ml-2"
        onPress={() => open('https://t.me/mihomo_party_group')}
      >
        Telegram
      </Button>

      <Button
        size="sm"
        variant="flat"
        className="ml-2"
        onPress={() =>
          // biome-ignore lint/style/useTemplate: <explanation>
          navigator.clipboard.writeText('```\n' + error.message + '\n' + error.stack + '\n```')
        }
      >
        {t('common.error.copyErrorMessage')}
      </Button>

      <p className="my-2">{error.message}</p>

      <details title="Error Stack">
        <summary>Error Stack</summary>
        <pre>{error.stack}</pre>
      </details>
    </div>
  )
}

interface Props {
  children?: ReactNode
}

const BaseErrorBoundary = (props: Props): JSX.Element => {
  return <ErrorBoundary FallbackComponent={ErrorFallback}>{props.children}</ErrorBoundary>
}

export default BaseErrorBoundary
