type Model = "gpt-4o" | "gpt-4o-mini";

type Props = {
  model: Model;
  onChange: (model: Model) => void;
};

export default function ModelSelector({ model, onChange }: Props) {
  return (
    <select
      value={model}
      onChange={(e) => onChange(e.target.value as Model)}
      className="rounded-md bg-gray-700 px-3 py-1.5 text-sm text-gray-100 outline-none focus:ring-2 focus:ring-gray-500"
    >
      <option value="gpt-4o-mini">GPT-4o mini</option>
      <option value="gpt-4o">GPT-4o</option>
    </select>
  );
}
