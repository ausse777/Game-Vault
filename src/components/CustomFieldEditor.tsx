import { useState } from 'react';
import type { CustomField, CustomFieldType } from '../models/types';
import { validateCustomField } from '../utils/validation';

interface Props {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

const typeOptions: CustomFieldType[] = ['text', 'number', 'boolean', 'date', 'choice'];

export const CustomFieldEditor: React.FC<Props> = ({ fields, onChange }) => {
  const [error, setError] = useState('');

  const addField = () => {
    onChange([...fields, { key: '', type: 'text', value: '' }]);
  };

  const update = (index: number, partial: Partial<CustomField>) => {
    const next = [...fields];
    next[index] = { ...next[index], ...partial };
    if (next[index].type !== 'choice') delete next[index].options;
    const validation = validateCustomField(next[index]);
    setError(validation ?? '');
    onChange(next);
  };

  const remove = (index: number) => onChange(fields.filter((_, i) => i !== index));

  return (
    <div>
      {fields.map((field, idx) => (
        // Field names are editable, so they cannot be used as React keys without
        // remounting the input and interrupting mobile keyboards on every change.
        <div className="field-card" key={idx}>
          <input placeholder="Field name" value={field.key} onChange={(e) => update(idx, { key: e.target.value })} />
          <select value={field.type} onChange={(e) => update(idx, { type: e.target.value as CustomFieldType, value: '' })}>
            {typeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>

          {field.type === 'boolean' && (
            <select value={String(field.value)} onChange={(e) => update(idx, { value: e.target.value === 'true' })}>
              <option value="true">True</option><option value="false">False</option>
            </select>
          )}
          {field.type === 'number' && <input type="number" value={String(field.value ?? '')} onChange={(e) => update(idx, { value: Number(e.target.value) })} />}
          {field.type === 'date' && <input type="date" value={String(field.value ?? '')} onChange={(e) => update(idx, { value: e.target.value })} />}
          {field.type === 'text' && <input value={String(field.value ?? '')} onChange={(e) => update(idx, { value: e.target.value })} />}
          {field.type === 'choice' && (
            <>
              <input
                placeholder="Option1, Option2"
                value={(field.options ?? []).join(', ')}
                onChange={(e) => update(idx, { options: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
              />
              <select value={String(field.value ?? '')} onChange={(e) => update(idx, { value: e.target.value })}>
                <option value="">Select option</option>
                {(field.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </>
          )}
          <button className="danger" type="button" onClick={() => remove(idx)}>Remove field</button>
        </div>
      ))}
      {error && <p className="error-text">{error}</p>}
      <button type="button" onClick={addField}>Add custom field</button>
    </div>
  );
};
