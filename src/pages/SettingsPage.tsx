import React, { useRef, useState } from 'react';
import { Download, Upload, Target, RotateCcw, Trash2, Sun, Moon } from 'lucide-react';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/Modal';
import { useStore } from '../stores/useStore';
import { useToastStore } from '../stores/useToastStore';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, exportData, importData, reviewLogs, resetAllData } = useStore();
  const addToast = useToastStore(s => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(String(settings.dailyGoal));
  const [showResetModal, setShowResetModal] = useState(false);

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

  const handleReset = () => {
    resetAllData();
    addToast('数据已重置', 'info');
    setShowResetModal(false);
    setTimeout(() => window.location.reload(), 800);
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

      {/* 主题切换 */}
      <section className="bg-surface-card rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
          {settings.theme === 'dark' ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-primary" />} 界面主题
        </h3>
        <p className="text-xs text-muted mb-4">选择你偏好的显示模式</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateSettings({ theme: 'light' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              settings.theme === 'light'
                ? 'border-primary bg-primary/10 text-ink'
                : 'border-hairline text-muted hover:text-ink hover:bg-surface-soft'
            }`}
          >
            <Sun size={16} /> 亮色
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              settings.theme === 'dark'
                ? 'border-primary bg-primary/10 text-ink'
                : 'border-hairline text-muted hover:text-ink hover:bg-surface-soft'
            }`}
          >
            <Moon size={16} /> 暗色
          </button>
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

      {/* 重置数据 */}
      <section className="bg-surface-card rounded-xl p-5 mb-4 border border-danger/20">
        <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
          <Trash2 size={16} className="text-danger" /> 重置数据
        </h3>
        <p className="text-xs text-muted mb-4">
          清除所有学习本、卡片和复习记录。此操作不可撤销，请先导出备份。
        </p>
        <Button variant="danger" onClick={() => setShowResetModal(true)}>
          <Trash2 size={15} className="mr-1.5" /> 清除所有数据
        </Button>
      </section>

      {/* 关于 */}
      <section className="bg-surface-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
          <RotateCcw size={16} className="text-primary" /> 关于
        </h3>
        <p className="text-xs text-muted">
          温故 v1.0 — 基于 "351-351" 艾宾浩斯间隔法的学习工具。
          数据存储在浏览器本地 (localStorage)，清除浏览器缓存前请先导出备份。
        </p>
      </section>

      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="确认重置数据"
        message="此操作将清除所有学习本、卡片、复习记录和等级数据。此操作不可撤销，确定要继续吗？"
        confirmText="确认重置"
        cancelText="取消"
      />
    </div>
  );
};

export default SettingsPage;
