import React, { useRef, useState } from 'react';
import { Download, Upload, Target, RotateCcw } from 'lucide-react';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useStore } from '../stores/useStore';
import { useToastStore } from '../stores/useToastStore';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, exportData, importData, reviewLogs } = useStore();
  const addToast = useToastStore(s => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(String(settings.dailyGoal));

  const handleSaveGoal = () => {
    const val = parseInt(dailyGoal, 10);
    if (val > 0 && val <= 500) {
      updateSettings({ dailyGoal: val });
      addToast('每日目标已保存', 'success');
    } else {
      addToast('请输入 1-500 之间的数字', 'error');
    }
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoryflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('数据已导出', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      const error = importData(reader.result as string);
      if (error) addToast(error, 'error');
      else {
        addToast('数据已导入，页面将刷新', 'success');
        setTimeout(() => window.location.reload(), 1000);
      }
      setImporting(false);
    };
    reader.onerror = () => { addToast('文件读取失败', 'error'); setImporting(false); };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h2 className="heading-serif text-xl text-ink mb-7">设置</h2>

      {/* 每日目标 */}
      <section className="bg-surface-card rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
          <Target size={16} className="text-primary" /> 每日复习目标
        </h3>
        <p className="text-xs text-muted mb-4">设定每天希望复习的卡片数量，用于追踪学习进度</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input type="number" min={1} max={500} value={dailyGoal}
              onChange={e => setDailyGoal(e.target.value)} placeholder="20" />
          </div>
          <Button onClick={handleSaveGoal}>保存</Button>
        </div>
      </section>

      {/* 数据管理 */}
      <section className="bg-surface-card rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
          <Download size={16} className="text-primary" /> 数据管理
        </h3>
        <p className="text-xs text-muted mb-4">
          当前共有 {useStore.getState().cards.length} 张卡片，{reviewLogs.length} 条复习记录
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={15} className="mr-1.5" /> 导出备份
          </Button>
          <Button variant="secondary" loading={importing} onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} className="mr-1.5" /> 导入备份
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="sr-only" />
        </div>
        <p className="text-xs text-muted mt-3">
          导出为 JSON 文件，可导入到其他设备。导入会覆盖当前所有数据。
        </p>
      </section>

      {/* 关于 */}
      <section className="bg-surface-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
          <RotateCcw size={16} className="text-primary" /> 关于
        </h3>
        <p className="text-xs text-muted">
          MemoryFlow v1.0 — 基于 "351-351" 艾宾浩斯间隔法的学习工具。
          数据存储在浏览器本地 (localStorage)，清除浏览器缓存前请先导出备份。
        </p>
      </section>
    </div>
  );
};

export default SettingsPage;
