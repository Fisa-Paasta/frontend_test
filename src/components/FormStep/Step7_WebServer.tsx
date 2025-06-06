import React from 'react';
import { useSurvey } from '@/context/SurveyContext';
import { useState, useEffect } from 'react';
import { WebServerItem, WebServerType } from '@/types/survey';
import {
  Trash2Icon
} from 'lucide-react';

type ValidWebServerType = Exclude<WebServerType, ''>;

const serverCards: { name: ValidWebServerType; label: string; src: string }[] = [
  { name: 'nginx', label: 'Nginx', src: '/img/webserver/nginx.svg' },
  { name: 'apache', label: 'Apache HTTP Server', src: '/img/webserver/apache.svg' },
  { name: 'tomcat', label: 'Tomcat', src: '/img/webserver/tomcat.svg' }
];

const webServerOptions: Record<ValidWebServerType, string[]> = {
  nginx: ['1.28.0 (LTS)', '1.27.5'],
  apache: ['2.4.63 (Latest)', '2.4.0'],
  tomcat: ['11.0', '10.1', '9.0']
};

export default function Step7_WebServer() {
  const { formData, updateFormData } = useSurvey();

  const [webServerItems, setWebServerItems] = useState<WebServerItem[]>(() =>
    formData.webServerItems?.length
      ? formData.webServerItems
      : [{ id: Date.now(), server: '', version: '' }]
  );

  useEffect(() => {
    // 현재 webServerItems와 formData.webServerItems가 다를 경우에만 updateFormData 호출
    if (JSON.stringify(webServerItems) !== JSON.stringify(formData.webServerItems)) {
        updateFormData('webServerItems', webServerItems);
    }
  }, [webServerItems, updateFormData, formData.webServerItems]);

  // ✅ 개선된 서버 클릭 핸들러
  const handleServerClick = (id: number, serverName: string) => {
    setWebServerItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const currentServer = item.server;
          
          // 이미 선택된 서버를 다시 클릭하면 선택 해제
          if (currentServer === serverName) {
            console.log(`🔄 ${serverName} 선택 해제됨`);
            return { ...item, server: '' as WebServerType, version: '' };
          } else {
            // 새로운 서버 선택
            console.log(`✅ ${serverName} 선택됨`);
            return { ...item, server: serverName as WebServerType, version: '' };
          }
        }
        return item;
      })
    );
  };

  const addWebServerItem = () => {
    setWebServerItems((prev) => [
      ...prev,
      { id: Date.now(), server: '', version: '' }
    ]);
  };

  // ✅ ID 기반 삭제로 수정
  const removeWebServerItem = (targetId: number) => {
    if (webServerItems.length <= 1) return; // 마지막 항목은 삭제 불가
    setWebServerItems((prev) => prev.filter((item) => item.id !== targetId));
  };

  const handleVersionChange = (id: number, value: string) => {
    setWebServerItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, version: value } : item
      )
    );
  };

  return (
    <div className="space-y-4">
      {webServerItems.map((item, index) => (
        <div
          key={item.id}
          // ⭐ 여기에 data-testid 추가 ⭐
          data-testid={`webserver-item-${item.id}`} 
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4"
        >
          {/* ✅ 휴지통 버튼을 legend에 통합 */}
          <fieldset>
            <legend className="text-sm font-medium mb-3 flex items-center justify-between">
              <span>
                웹서버 선택 {index + 1}
                <span className="text-xs text-gray-500 ml-2">(선택된 항목을 다시 클릭하면 해제됩니다)</span>
              </span>
              {webServerItems.length > 1 && ( // 여기 조건이 중요합니다!
                <button
                  type="button"
                  onClick={() => removeWebServerItem(item.id)}
                  className="text-red-600 text-lg hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                  aria-label={`웹서버 항목 ${index + 1} 삭제`}
                >
                  <Trash2Icon color='black' size={18} />
                </button>
              )}
            </legend>
            <div className="grid grid-cols-3 gap-4">
              {serverCards.map((server) => (
                <button
                  key={server.name}
                  type="button"
                  onClick={() => handleServerClick(item.id, server.name)}
                  className={`p-3 rounded-lg border-2 cursor-pointer text-center transition shadow-sm block w-full
                    ${item.server === server.name
                      ? 'border-violet-500 bg-violet-600 text-white'
                      : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white'}
                  `}
                  aria-pressed={item.server === server.name}
                  aria-label={`${server.label} ${item.server === server.name ? '선택됨 (클릭하여 해제)' : '선택하기'}`}
                >
                  <img
                    src={server.src}
                    alt=""
                    className="h-14 mx-auto object-contain mb-2"
                  />
                  <span className="text-sm font-semibold">{server.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* 버전 선택 */}
          {item.server && (
            <div>
              <label htmlFor={`version-select-${item.id}`} className="block mb-1 text-sm font-medium">
                {item.server} 버전 선택
              </label>
              <select
                id={`version-select-${item.id}`}
                value={item.version}
                onChange={(e) => handleVersionChange(item.id, e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-input-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                aria-label={`${item.server} 버전 선택`}
              >
                <option value="">버전 선택</option>
                {(webServerOptions[item.server as ValidWebServerType] || []).map((ver) => (
                  <option key={ver} value={ver}>{ver}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}

      {/* 추가 버튼 */}
      <button
        type="button"
        onClick={addWebServerItem}
        className="mt-2 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="새 웹서버 항목 추가"
      >
        + 웹서버 추가
      </button>
    </div>
  );
}