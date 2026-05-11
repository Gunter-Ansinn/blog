interface Props {
  handle: string  // without @
  name?: string   // optional display name shown before the handle
}

export default function XHandle({ handle, name }: Props) {
  return (
    <a
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3em',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85em',
        color: 'var(--gold)',
        textDecoration: 'none',
        borderBottom: '1px dotted color-mix(in srgb, var(--gold) 50%, transparent)',
        paddingBottom: '0.05em',
        whiteSpace: 'nowrap',
      }}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        style={{ flexShrink: 0, marginTop: '0.05em' }}
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
      {name && <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '1.18em' }}>{name}</span>}
      <span>@{handle}</span>
    </a>
  )
}
