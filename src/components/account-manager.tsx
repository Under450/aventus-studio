import { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { Account } from '../types';
import { createAccount, upsertAccount, deleteAccount, saveAccounts, saveActiveAccountId } from '../lib/accounts';

interface AccountManagerProps {
  accounts: Account[];
  activeAccount: Account | null;
  onClose: () => void;
  onAccountsChange: (accounts: Account[]) => void;
  onActiveChange: (account: Account) => void;
}

const emptyForm = { name: '', claudeApiKey: '' };

export function AccountManager({ accounts, activeAccount, onClose, onAccountsChange, onActiveChange }: AccountManagerProps) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Company/creator name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    let updated: Account[];
    if (editingId) {
      const existing = accounts.find(a => a.id === editingId)!;
      updated = upsertAccount(accounts, { ...existing, ...form });
    } else {
      const account = createAccount(form.name.trim(), '', '', form.claudeApiKey.trim());
      updated = upsertAccount(accounts, account);
      // Auto-activate if it's the first account
      if (accounts.length === 0) {
        saveActiveAccountId(account.id);
        onActiveChange(account);
      }
    }
    saveAccounts(updated);
    onAccountsChange(updated);
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setForm({ name: account.name, claudeApiKey: account.claudeApiKey });
    setExpandedId(null);
  };

  const handleDelete = (id: string) => {
    const updated = deleteAccount(accounts, id);
    saveAccounts(updated);
    onAccountsChange(updated);
    if (activeAccount?.id === id && updated.length > 0) {
      saveActiveAccountId(updated[0].id);
      onActiveChange(updated[0]);
    }
  };

  const handleActivate = (account: Account) => {
    saveActiveAccountId(account.id);
    onActiveChange(account);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--studio-border)',
    borderRadius: 7,
    fontSize: '13px',
    color: 'var(--studio-ink)',
    backgroundColor: 'var(--studio-panel)',
    fontFamily: 'var(--studio-sans)',
    outline: 'none',
  };

  const labelStyle = {
    fontSize: '10px',
    fontWeight: 700 as const,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--studio-ink-4)',
    display: 'block',
    marginBottom: 5,
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(15,15,13,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div
        style={{
          width: 520,
          maxHeight: '85vh',
          backgroundColor: 'var(--studio-panel)',
          border: '1px solid var(--studio-border)',
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--studio-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--studio-ink-4)', marginBottom: 3 }}>COMPANIES / CREATORS</p>
            <h2 style={{ fontFamily: 'var(--studio-serif)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--studio-ink)', letterSpacing: '-0.02em' }}>
              Manage Accounts
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--studio-border)',
              backgroundColor: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--studio-ink-3)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Existing accounts list */}
          {accounts.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ ...labelStyle, marginBottom: 10 }}>Your Companies / Creators</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {accounts.map(account => {
                  const isActive = activeAccount?.id === account.id;
                  const isExpanded = expandedId === account.id;
                  const isEditing = editingId === account.id;
                  return (
                    <div
                      key={account.id}
                      style={{
                        border: `1px solid ${isActive ? 'var(--studio-border)' : 'var(--studio-border-light)'}`,
                        borderRadius: 10,
                        overflow: 'hidden',
                        backgroundColor: isActive ? 'var(--studio-panel)' : 'var(--studio-bg)',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        {/* Active indicator */}
                        <button
                          onClick={() => handleActivate(account)}
                          title={isActive ? 'Active company/creator' : 'Set as active'}
                          style={{
                            width: 20, height: 20, borderRadius: '50%',
                            border: `1px solid ${isActive ? 'var(--studio-border)' : 'var(--studio-border-light)'}`,
                            backgroundColor: isActive ? 'var(--studio-ink)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: isActive ? 'default' : 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          {isActive && <Check size={10} color="#fff" strokeWidth={3} />}
                        </button>

                        {/* Name */}
                        <span style={{
                          flex: 1,
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'var(--studio-ink)' : 'var(--studio-ink-2)',
                        }}>
                          {account.name}
                        </span>

                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(account)}
                          style={{
                            fontSize: '11px', fontWeight: 500,
                            color: 'var(--studio-ink-3)',
                            backgroundColor: 'transparent', border: 'none',
                            cursor: 'pointer', padding: '3px 8px',
                          }}
                        >
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={accounts.length === 1}
                          style={{
                            width: 26, height: 26, borderRadius: 6,
                            border: '1px solid var(--studio-border-light)',
                            backgroundColor: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: accounts.length === 1 ? 'not-allowed' : 'pointer',
                            opacity: accounts.length === 1 ? 0.3 : 1,
                            color: 'var(--studio-ink-3)',
                          }}
                        >
                          <Trash2 size={11} />
                        </button>

                        {/* Expand toggle */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : account.id)}
                          style={{
                            width: 26, height: 26, borderRadius: 6,
                            border: '1px solid var(--studio-border-light)',
                            backgroundColor: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--studio-ink-3)',
                          }}
                        >
                          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && !isEditing && (
                        <div style={{
                          padding: '10px 14px 14px',
                          borderTop: '1px solid var(--studio-border-light)',
                          backgroundColor: 'var(--studio-bg)',
                        }}>
                          {[
                            { label: 'Claude API Key', value: account.claudeApiKey ? '••••••••' + account.claudeApiKey.slice(-4) : '—' },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                              <span style={{ fontSize: '11px', color: 'var(--studio-ink-4)', width: 110, flexShrink: 0 }}>{label}</span>
                              <span style={{ fontSize: '11px', color: 'var(--studio-ink-2)', fontFamily: value.startsWith('•') ? 'monospace' : 'inherit' }}>{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add / Edit form */}
          <div style={{
            padding: '18px 20px',
            border: '1px solid var(--studio-border)',
            borderRadius: 10,
            backgroundColor: 'var(--studio-bg)',
          }}>
            <p style={{ ...labelStyle, marginBottom: 14 }}>
              {editingId ? 'Edit Company/Creator' : 'Add New Company/Creator'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Company/Creator Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                  style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : 'var(--studio-border)' }}
                />
                {errors.name && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: 4 }}>{errors.name}</p>}
              </div>

              {/* Claude API Key */}
              <div>
                <label style={labelStyle}>Claude API Key</label>
                <input
                  type="password"
                  value={form.claudeApiKey}
                  onChange={e => setForm(f => ({ ...f, claudeApiKey: e.target.value }))}
                  placeholder="sk-ant-..."
                  style={inputStyle}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button
                  onClick={handleSave}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px',
                    backgroundColor: 'var(--studio-ink)',
                    color: '#fff',
                    border: '1px solid var(--studio-border)',
                    borderRadius: 7,
                    fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--studio-sans)',
                  }}
                >
                  <Plus size={13} />
                  {editingId ? 'Save Changes' : 'Add Company/Creator'}
                </button>
                {editingId && (
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: '9px 18px',
                      backgroundColor: 'transparent',
                      color: 'var(--studio-ink-3)',
                      border: '1px solid var(--studio-border-light)',
                      borderRadius: 7,
                      fontSize: '12px', fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--studio-sans)',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
