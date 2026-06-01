type Props = {
  title: string
}

export default function About({ title }: Props) {
  return (
    <section id="hero">
      <div className="hero-inr">
        <h1 className="hero-ttl">{title}</h1>
        <p className="hero-txt-1">{txt_1}</p>
      </div>
    </section>
  );
}