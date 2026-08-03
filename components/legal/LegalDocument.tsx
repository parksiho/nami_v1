type Section = {
  key: string
  heading: string
  body: string
}

type Props = {
  title: string
  lastUpdatedLabel: string
  intro: string
  sections: Section[]
}

export function LegalDocument({
  title,
  lastUpdatedLabel,
  intro,
  sections,
}: Props) {
  return (
    <article className="legal-doc">
      <header className="legal-doc__header">
        <h1>{title}</h1>
        <p className="legal-doc__updated">{lastUpdatedLabel}</p>
      </header>
      <p className="legal-doc__intro">{intro}</p>
      {sections.map((section) => (
        <section key={section.key} className="legal-doc__section">
          <h2>{section.heading}</h2>
          {section.body.split(/\n\n+/).map((paragraph, index) => (
            <p key={`${section.key}-${index}`}>{paragraph}</p>
          ))}
        </section>
      ))}
    </article>
  )
}
