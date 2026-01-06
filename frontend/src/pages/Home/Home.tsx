import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ShieldCheck, Monitor, Users } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Background gradients / glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 shadow-lg shadow-blue-500/40">
              <span className="text-sm font-bold">P</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">ProctoFlex AI</p>
              <p className="text-[11px] text-slate-500">
                Surveillance intelligente d&apos;examens
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50 transition"
              >
              Accéder à l&apos;espace enseignant
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="mt-10 flex flex-1 flex-col gap-10 md:mt-16 md:flex-row md:items-center">
          {/* Left column */}
          <div className="max-w-xl space-y-6">
            <p className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
              <Brain className="mr-1.5 h-3.5 w-3.5" />
              IA de surveillance en temps réel pour vos examens
            </p>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl text-slate-900">
                Sécurisez vos examens en ligne
                <span className="block bg-gradient-to-r from-blue-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                  sans complexité technique
                </span>
              </h1>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                ProctoFlex AI combine vision par ordinateur, analyse audio et suivi d&apos;écran
                pour détecter automatiquement les comportements suspects, tout en restant simple à
                déployer pour vos équipes pédagogiques.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/40 hover:bg-blue-500 transition"
              >
                Se connecter en tant qu&apos;enseignant
              </Link>
              <div className="text-xs text-slate-500">
                Identifiants de démo :{' '}
                <span className="font-mono">admin@proctoflex.ai / admin123</span>
              </div>
            </div>

            {/* Small highlight strip */}
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Compatible Postgres · Redis · FastAPI
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Interface React & Electron pour étudiants
              </span>
            </div>
          </div>

          {/* Right column: key features card */}
          <div className="w-full md:w-auto md:flex-1">
            <div className="relative rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-xl shadow-slate-200/80 backdrop-blur-sm sm:p-5">
              {/* subtle top border glow */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <Monitor className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Surveillance multi-canal</p>
                    <p className="text-xs text-slate-500">
                      Webcam, micro et partage d&apos;écran analysés en continu pendant toute la
                      durée de l&apos;épreuve.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Alertes explicables</p>
                    <p className="text-xs text-slate-500">
                      Chaque alerte IA inclut un score de risque, une catégorie (regard, objets,
                      audio) et un résumé lisible par l&apos;enseignant.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                    <Users className="h-5 w-5 text-violet-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Pensé pour les enseignants</p>
                    <p className="text-xs text-slate-500">
                      Créez vos examens, invitez les étudiants et consultez les rapports de session
                      en quelques clics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>
            ProctoFlex AI · Prototype de plateforme de surveillance d&apos;examens assistée par
            intelligence artificielle.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;

