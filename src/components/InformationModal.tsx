import { useSurvey } from '@/context/SurveyContext';
import { FileText } from 'lucide-react';
import { useEffect } from 'react';
import React from 'react'

interface Props {
  onClose: () => void;
  onSubmit: () => void;
  isOpen: boolean;
  title: string;
  message: string;
  icon: 'info' | 'success' | 'warning' | 'error'; // 아이콘 타입을 지정
}

const formatName = (key?: string) => {
  if (!key) return '선택 안함';
  const mappings: Record<string, string> = {
    spring_boot: 'Spring Boot', express: 'Express', nestjs: 'NestJS',
    django: 'Django', flask: 'Flask', fiber: 'Fiber', rails: 'Ruby on Rails',
    gin: 'Gin', echo: 'Echo', react: 'React', vue: 'Vue.js', angular: 'Angular',
    nextjs: 'Next.js', github_actions: 'GitHub Actions', gitlab_ci: 'GitLab CI/CD',
    jenkins: 'Jenkins', nginx: 'Nginx', apache: 'Apache', tomcat: 'Tomcat',
    mysql: 'MySQL', postgresql: 'PostgreSQL', mariadb: 'MariaDB', oracle: 'Oracle DB',
    mongodb: 'MongoDB', redis: 'Redis', elasticsearch: 'Elasticsearch', cassandra: 'Cassandra',
    relational: 'Relational DB', nosql: 'NoSQL DB'
  };
  return mappings[key] ?? key;
};

const formatValue = (value?: string | number | null): React.ReactNode =>
  value === undefined || value === null || value === ''
    ? <span className="text-gray-500 dark:text-gray-400 italic">선택 안함</span>
    : <span className="text-gray-900 dark:text-white">{String(value)}</span>;

const KeyValue = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex items-center gap-4">
    <span className="text-sm text-gray-500 dark:text-gray-400 w-32 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium flex-1">{value}</span>
  </div>
);

const KeyGroup = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <div className="border-l-4 border-purple-500 pl-6 space-y-3">
    {title && <h4 className="text-base font-semibold text-gray-800 dark:text-white mb-3">{title}</h4>}
    {children}
  </div>
);

export default function InformationModal({ onClose, onSubmit, isOpen, title, message, icon }: Props) {
  const { formData } = useSurvey();

  // isOpen이 false일 경우 모달을 렌더링하지 않음
  if (!isOpen) return null;

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-2xl p-8 w-full max-w-6xl shadow-2xl overflow-y-auto max-h-[90vh] space-y-8">
        <header>
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6" />
            신청서 상세 내역
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            신청하신 인프라 환경의 상세 설정 내역을 확인하실 수 있습니다.
          </p>
        </header>

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <section>
              <KeyGroup title="🔧 기본 환경 설정">
                <KeyValue label="환경 타입" value={formatValue(formData.env)} />
                {formData.env === 'iaas' ? (
                  <>
                    <KeyValue label="호스트명" value={formatValue(formData.vm.hostname)} />
                    <KeyValue label="사용자명" value={formatValue(formData.vm.username)} />
                    <KeyValue label="배포 환경" value={formatValue(formData.vm.environment)} />
                  </>
                ) : (
                  <>
                    <KeyValue label="오케스트레이션" value={formatValue(formatName(formData.k8s?.type))} />
                    <KeyValue label="네임스페이스" value={formatValue(formData.k8s?.namespace)} />
                    <KeyValue label="워커 노드 수" value={formatValue(formData.k8s?.node)} />
                  </>
                )}
              </KeyGroup>
            </section>

            <section className="border-t border-dashed border-zinc-300 dark:border-zinc-600 pt-6">
              <KeyGroup title="💻 리소스 설정">
                {formData.env === 'iaas' && formData.vm.environment === 'aws' && (
                  <>
                    <KeyValue label="EC2 인스턴스" value={formatValue(formData.vm.ec2Type)} />
                    <KeyValue label="EBS 볼륨 타입" value={formatValue(formData.vm.ebsType)} />
                    <KeyValue label="EBS 볼륨 크기" value={formatValue(`${formData.vm.ebsSize} GB`)} />
                  </>
                )}
                {formData.env === 'iaas' && formData.vm.environment === 'on-premise' && (
                  <>
                    <KeyValue label="CPU 코어" value={formatValue(`${formData.resources.cpu} cores`)} />
                    <KeyValue label="메모리(RAM)" value={formatValue(`${formData.resources.ram} GB`)} />
                    <KeyValue label="디스크 용량" value={formatValue(`${formData.resources.disk} GB`)} />
                  </>
                )}
                {formData.env === 'paas' && (
                  <>
                    {formData.k8s?.type === 'amazon_eks' ? (
                      <>
                        <KeyValue label="EC2 인스턴스" value={formatValue(formData.vm.ec2Type)} />
                        <KeyValue label="EBS 볼륨 타입" value={formatValue(formData.vm.ebsType)} />
                        <KeyValue label="EBS 볼륨 크기" value={formatValue(`${formData.vm.ebsSize} GB`)} />
                      </>
                    ) : (
                      <>
                        <KeyValue label="CPU 코어" value={formatValue(`${formData.resources.cpu} cores`)} />
                        <KeyValue label="메모리(RAM)" value={formatValue(`${formData.resources.ram} GB`)} />
                        <KeyValue label="디스크 용량" value={formatValue(`${formData.resources.disk} GB`)} />
                      </>
                    )}
                  </>
                )}
              </KeyGroup>
            </section>

            <section className="border-t border-dashed border-zinc-300 dark:border-zinc-600 pt-6">
              <KeyGroup title="🖥️ 운영체제">
                <KeyValue label="OS 종류" value={formatValue(`${formatName(formData.os.name)}`)} />
                <KeyValue label="OS 버전" value={formatValue(formData.os.version)} />
              </KeyGroup>
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <KeyGroup title="🎨 프론트엔드">
                {formData.frontendItems?.length > 0 && formData.frontendItems.some(f => f.framework || f.version) ? (
                  formData.frontendItems.map((f, index) => (
                    <KeyValue 
                      key={`frontend-item-${f.id}-${f.framework}`} 
                      label={`프레임워크 ${index + 1}`} 
                      value={formatValue(`${formatName(f.framework)} ${f.version}`)} 
                    />
                  ))
                ) : (
                  <KeyValue label="프레임워크" value={formatValue('')} />
                )}
                <KeyValue label="프론트 도메인" value={formatValue(formData.frontendDomain)} />
              </KeyGroup>
            </section>

            <section className="border-t border-dashed border-zinc-300 dark:border-zinc-600 pt-6">
              <KeyGroup title="⚙️ 백엔드">
                {formData.backendItems?.length > 0 && formData.backendItems.some(b => b.language || b.framework) ? (
                  formData.backendItems.map((b, index) => (
                    <KeyValue
                      key={`backend-item-${b.id}-${b.language}-${b.framework}`}
                      label={`언어/FW ${index + 1}`}
                      value={formatValue(`${formatName(b.language)} ${b.languageVersion} / ${formatName(b.framework)} ${b.frameworkVersion}`)}
                    />
                  ))
                ) : (
                  <KeyValue label="백엔드" value={formatValue('')} />
                )}
                <KeyValue label="API 도메인" value={formatValue(formData.apiDomain)} />
                {formData.apiPaths?.length > 0 && formData.apiPaths.some(p => p.trim()) ? (
                  formData.apiPaths.filter(p => p.trim()).map((p, pathIndex) => (
                    <KeyValue 
                      key={`api-path-${pathIndex}-${p}`} 
                      label={`API 경로 ${pathIndex + 1}`} 
                      value={formatValue(p)} 
                    />
                  ))
                ) : (
                  <KeyValue label="API 경로" value={formatValue('')} />
                )}
              </KeyGroup>
            </section>

            <section className="border-t border-dashed border-zinc-300 dark:border-zinc-600 pt-6">
              <KeyGroup title="🌐 웹서버">
                {formData.webServerItems?.length > 0 && formData.webServerItems.some(w => w.server || w.version) ? (
                  formData.webServerItems.map((w, index) => (
                    <KeyValue 
                      key={`webserver-item-${w.id}-${w.server}`} 
                      label={`웹서버 ${index + 1}`} 
                      value={formatValue(`${formatName(w.server)} ${w.version}`)} 
                    />
                  ))
                ) : (
                  <KeyValue label="웹서버" value={formatValue('')} />
                )}
              </KeyGroup>
            </section>

            <section className="border-t border-dashed border-zinc-300 dark:border-zinc-600 pt-6">
              <KeyGroup title="🗄️ 데이터베이스">
                {formData.dbItems?.length > 0 && formData.dbItems.some(d => d.type || d.name || d.version || d.size) ? (
                  formData.dbItems.map((d, index) => (
                    <KeyValue
                      key={`db-item-${d.id}-${d.name}`}
                      label={`DB ${index + 1}`}
                      value={formatValue(`${formatName(d.type)} / ${formatName(d.name)} ${d.version} (${d.size} GB)`)}
                    />
                  ))
                ) : (
                  <KeyValue label="데이터베이스" value={formatValue('')} />
                )}
              </KeyGroup>
            </section>
          </div>
        </main>

        <footer className="flex justify-end gap-3 pt-6 border-t border-zinc-300 dark:border-zinc-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-6 py-3 text-sm rounded-md bg-[#5A3EBA] text-white hover:bg-[#4932A0] focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            다음
          </button>
        </footer>
      </div>
    </div>
  );
}
