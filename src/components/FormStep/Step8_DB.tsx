// src/components/FormStep/Step8_DB.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useSurvey } from '@/context/SurveyContext';
import { DBItem, DBType, DBName } from '@/types/survey';

// DB 타입 및 이름 목록 (예시 데이터)
const DB_TYPES: { type: DBType; label: string }[] = [
  { type: 'relational', label: 'Relational DB' },
  { type: 'nosql', label: 'NoSQL DB' },
];

const DB_NAMES: Record<DBType, { name: DBName; label: string; versions: string[] }[]> = {
  relational: [
    { name: 'mysql', label: 'MySQL', versions: ['8.0.36 (LTS)', '8.0.35', '8.0.34'] },
    { name: 'postgresql', label: 'PostgreSQL', versions: ['16.2', '16.1', '15.6'] },
    { name: 'oracle', label: 'Oracle', versions: ['19c', '18c', '12c'] },
  ],
  nosql: [
    { name: 'mongodb', label: 'MongoDB', versions: ['7.0', '6.0', '5.0'] },
    { name: 'redis', label: 'Redis', versions: ['7.2.4', '7.2.3', '7.0.15'] },
    { name: 'cassandra', label: 'Cassandra', versions: ['4.1.3', '4.0.11', '3.11.16'] },
  ],
  '': [], // 빈 문자열 타입에 대한 항목 추가
};

// 깊은 비교 (deep comparison) 함수 (재사용을 위해 외부로 빼둠)
// ID는 비교에서 제외합니다. ID는 React의 key prop에만 사용되어야 하며,
// 데이터의 논리적 동일성을 판단할 때는 사용되지 않아야 합니다.
const areDbItemsEqual = (arr1: DBItem[], arr2: DBItem[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    const item1 = arr1[i];
    const item2 = arr2[i];
    if (
      item1.type !== item2.type ||
      item1.name !== item2.name ||
      item1.version !== item2.version ||
      item1.size !== item2.size
    ) {
      return false;
    }
  }
  return true;
};

const Step8_DB: React.FC = () => {
  const { formData, updateFormData } = useSurvey();

  const [dbItems, setDbItems] = useState<DBItem[]>(
    formData.dbItems && formData.dbItems.length > 0
      ? formData.dbItems
      : [{ id: Date.now(), type: '' as DBType, name: '' as DBName, version: '', size: '' }]
  );

  useEffect(() => {
    // 현재 dbItems가 formData.dbItems와 다를 경우에만 updateFormData 호출
    // 이렇게 함으로써 불필요한 updateFormData 호출을 방지하고,
    // 특히 formData가 이미 채워져 있을 때 초기 렌더링 시 호출되지 않도록 합니다.
    if (!areDbItemsEqual(dbItems, formData.dbItems || [])) {
      updateFormData('dbItems', dbItems);
    }
  }, [dbItems, formData.dbItems, updateFormData]);

  const handleDbTypeChange = useCallback((id: number, clickedType: DBType) => {
    setDbItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const newType = item.type === clickedType ? ('' as DBType) : clickedType;
          return { ...item, type: newType, name: '' as DBName, version: '', size: '' };
        }
        return item;
      })
    );
  }, []);

  const handleDbNameChange = useCallback((id: number, clickedName: DBName) => {
    setDbItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const newName = item.name === clickedName ? ('' as DBName) : clickedName;
          return { ...item, name: newName, version: '', size: '' };
        }
        return item;
      })
    );
  }, []);

  const handleDbVersionChange = useCallback((id: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    const version = e.target.value;
    setDbItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, version } : item
      )
    );
  }, []);

  const handleDbSizeChange = useCallback((id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const size = e.target.value;
    setDbItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, size } : item
      )
    );
  }, []);

  const addDbItem = useCallback(() => {
    setDbItems(prevItems => [
      ...prevItems,
      { id: Date.now(), type: '' as DBType, name: '' as DBName, version: '', size: '' }
    ]);
  }, []);

  const removeDbItem = useCallback((id: number) => {
    setDbItems(prevItems => {
      if (prevItems.length === 1) {
        return prevItems; // 마지막 항목은 삭제할 수 없음
      }
      return prevItems.filter(item => item.id !== id);
    });
  }, []);

  const getDbNamesForType = useCallback((type: DBType) => {
    return DB_NAMES[type] || [];
  }, []);

  const getDbVersionsForName = useCallback((type: DBType, name: DBName) => {
    const db = DB_NAMES[type]?.find(db => db.name === name);
    return db ? db.versions : [];
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">데이터베이스 정보</h2>
      {dbItems.map((item, index) => (
        <div key={item.id} data-testid={`db-item-${item.id}`} className="p-4 border rounded-lg mb-4 relative">
          <h3 className="text-lg font-semibold mb-3">데이터베이스 항목 {index + 1}</h3>
          {dbItems.length > 1 && (
            <button
              type="button"
              className="absolute top-4 right-4 p-2 text-red-500 hover:bg-gray-100 rounded-full"
              onClick={() => removeDbItem(item.id)}
              aria-label={`데이터베이스 항목 ${index + 1} 삭제`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" x2="10" y1="11" y2="17"></line>
                <line x1="14" x2="14" y1="11" y2="17"></line>
              </svg>
            </button>
          )}

          <div className="mb-4">
            {/* 레이블이 버튼 그룹과 직접 연결되지 않으므로 for 속성 제거 */}
            {/* 시맨틱적으로 label은 input, select, textarea 등과 연결되어야 합니다. */}
            <span className="block text-sm font-medium text-gray-700 mb-1" id={`db-type-label-${item.id}`}>
              데이터베이스 타입 선택 {index + 1}
            </span>
            <div className="flex space-x-2" role="group" aria-labelledby={`db-type-label-${item.id}`}>
              {DB_TYPES.map(dbType => (
                <button
                  key={dbType.type}
                  type="button"
                  className={`px-4 py-2 rounded-md ${item.type === dbType.type ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => handleDbTypeChange(item.id, dbType.type)}
                  aria-pressed={item.type === dbType.type}
                >
                  {dbType.label} {item.type === dbType.type && '(선택됨)'}
                </button>
              ))}
            </div>
          </div>

          {item.type && (
            <div className="mb-4">
              <span className="block text-sm font-medium text-gray-700 mb-1" id={`db-name-label-${item.id}`}>
                {item.type} 데이터베이스 선택
              </span>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`db-name-label-${item.id}`}>
                {getDbNamesForType(item.type).map(dbName => (
                  <button
                    key={dbName.name}
                    type="button"
                    className={`px-4 py-2 rounded-md ${item.name === dbName.name ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                    onClick={() => handleDbNameChange(item.id, dbName.name)}
                    aria-pressed={item.name === dbName.name}
                  >
                    {dbName.label} {item.name === dbName.name && '(선택됨)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.name && (
            <>
              <div className="mb-4">
                <label htmlFor={`db-version-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  {DB_NAMES[item.type]?.find(db => db.name === item.name)?.label} 버전 선택
                </label>
                <select
                  id={`db-version-${item.id}`}
                  value={item.version}
                  onChange={(e) => handleDbVersionChange(item.id, e)}
                  className="w-[180px] p-2 border rounded-md"
                >
                  <option value="" disabled>버전 선택</option>
                  {getDbVersionsForName(item.type, item.name).map(version => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor={`db-size-input-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  DB 크기 (GB)
                </label>
                <input
                  id={`db-size-input-${item.id}`}
                  type="number"
                  value={item.size}
                  onChange={(e) => handleDbSizeChange(item.id, e)}
                  placeholder="예: 100"
                  min="1"
                  className="w-40 p-2 border rounded-md"
                />
                {item.size !== '' && parseInt(item.size) <= 0 && (
                  <p className="text-red-500 text-sm mt-1">유효한 크기를 입력해주세요.</p>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addDbItem}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
      >
        + 새 데이터베이스 항목 추가
      </button>
    </div>
  );
};

export default Step8_DB;