import { memo } from 'react'
import { isSecureProvenanceUrl } from '../utils/provenance'

interface SourceTickProvenanceLinkProps {
  url?: string
}

export const SourceTickProvenanceLink = memo(function SourceTickProvenanceLink({ url }: SourceTickProvenanceLinkProps) {
  return url && isSecureProvenanceUrl(url) ? (
    <p className="text-sm mt-3">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500"
      >
        View source-tick provenance<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </p>
  ) : (
    <p className="text-xs text-gray-500 mt-3" role="status">
      Source-tick provenance unavailable from the API.
    </p>
  )
})
