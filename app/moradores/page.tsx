
import Header from "@/components/Header";
import ListaMoradores from "./lista";

export default function MoradoresPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-12 bg-slate-900 min-h-screen">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <Header />

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h1 className="text-3xl font-bold text-white">
            Moradores
          </h1>
        </div>

        <ListaMoradores />
      </div>
    </div>
  );
}
