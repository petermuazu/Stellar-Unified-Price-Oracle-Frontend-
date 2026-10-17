import { useTranslation } from 'react-i18next'

export function useIsRtl(): boolean {
  const { i18n } = useTranslation()
  return i18n.dir() === 'rtl'
}
