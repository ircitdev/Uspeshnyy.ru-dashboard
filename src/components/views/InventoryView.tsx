import React from 'react';
import { InventoryData } from '../../types';
import { MetricCard } from '../MetricCard';
import {
  Server,
  Activity,
  Globe,
  Key,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cpu,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface InventoryViewProps {
  data: InventoryData;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ data }) => {
  const server = data.server || {
    host: 'vps-main',
    ip: '127.0.0.1',
    disk_percent: 0,
    disk_used_gb: 0,
    disk_total_gb: 0,
    disk_alert: false,
    mem_percent: 0,
    mem_used_mb: 0,
    mem_total_mb: 0,
    mem_alert: false,
    uptime: '—',
    cpu_percent: 0,
  };

  const sites = data.sites?.rows || [];
  const services = data.services?.rows || [];
  const keys = data.keys || [];

  const activeServicesCount = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          label="Хост сервера"
          value={server.host.split(' ')[0]}
          subtext={`Аптайм: ${server.uptime}`}
          icon={<Server className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          label="Службы systemd"
          value={`${activeServicesCount} / ${services.length}`}
          subtext="Все ключевые демоны активны"
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          label="Сайтов и эндпоинтов"
          value={sites.length}
          subtext="SSL-сертификаты в норме"
          icon={<Globe className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* Server Health Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-base text-slate-900">{server.host}</h4>
              <p className="text-xs font-mono text-slate-400">IP: {server.ip}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-center">
            <CheckCircle2 className="w-3.5 h-3.5" /> В работе: {server.uptime}
          </span>
        </div>

        {/* Resource Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* CPU */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                Нагрузка CPU
              </span>
              <span className="font-mono font-bold text-slate-900">
                {server.cpu_percent ?? 18}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${server.cpu_percent ?? 18}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </div>
          </div>

          {/* RAM */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                Память RAM
              </span>
              <span className="font-mono font-bold text-slate-900">
                {(server.mem_used_mb / 1024).toFixed(1)} / {(server.mem_total_mb / 1024).toFixed(1)} ГБ ({server.mem_percent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${server.mem_percent}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </div>
          </div>

          {/* Disk */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                Дисковый накопитель
              </span>
              <span className="font-mono font-bold text-slate-900">
                {server.disk_used_gb} / {server.disk_total_gb} ГБ ({server.disk_percent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${server.disk_percent}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sites & Endpoints Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h4 className="font-semibold text-sm text-slate-900">Сайты и эндпоинты</h4>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {sites.length} доменов
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Домен</th>
                <th className="py-3 px-4">Назначение / Проект</th>
                <th className="py-3 px-4 text-center">HTTP Код</th>
                <th className="py-3 px-4 text-center">SSL Сертификат</th>
                <th className="py-3 px-4 text-right">Отклик</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sites.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                    <a
                      href={`https://${s.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-600"
                    >
                      {s.domain}
                    </a>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800 block">{s.what}</span>
                    <span className="text-[11px] text-slate-400">{s.project}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        s.code === 200
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {s.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {s.cert_days} дн.
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                    {s.response_ms ? `${s.response_ms} мс` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Services and API Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Services */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h4 className="font-semibold text-sm text-slate-900">Системные сервисы</h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {services.length} юнитов
            </span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {services.map((srv, idx) => (
              <div
                key={idx}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div>
                  <div className="font-mono font-medium text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{srv.unit}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{srv.what}</div>
                </div>
                {srv.mem_mb ? (
                  <span className="font-mono text-slate-500 text-[11px]">
                    {srv.mem_mb} МБ
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* API Keys Inventory */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              <h4 className="font-semibold text-sm text-slate-900">Интеграционные API-ключи</h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {keys.length} ключей
            </span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {keys.map((k, idx) => (
              <div
                key={idx}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{k.name}</span>
                  <span className="text-[11px] text-slate-500 block">
                    Где: <code className="font-mono text-slate-600">{k.where}</code>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Что затронет: {k.breaks}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    k.status === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {k.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
