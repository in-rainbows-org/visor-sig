type HeaderTextProps = {
  title: string;
  description: string;
};

export default function HeaderText({ title, description }: HeaderTextProps) {
  return (
    <header className="text-center">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1 text-sm font-normal text-slate-500">{description}</p>
    </header>
  );
}
