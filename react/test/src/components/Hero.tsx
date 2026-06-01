type Props = {
  title: string;
  txt1: string;
};

export default function Hero({ title, txt1 }: Props) {
  return (
    <section id="hero">
      <div className="hero-inr">
        <h1 className="hero-ttl">{title}</h1>
        <p className="hero-txt-1">{txt1}</p>
      </div>
    </section>
  );
}
