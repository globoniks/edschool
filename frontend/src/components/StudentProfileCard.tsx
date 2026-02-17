import { User } from 'lucide-react';

interface StudentProfileCardProps {
  name: string;
  class: string;
  rollNumber?: string;
  admissionNumber?: string;
  photo?: string;
  onChildSelect?: () => void;
  showSelector?: boolean;
  children?: React.ReactNode;
}

export default function StudentProfileCard({
  name,
  class: className,
  rollNumber,
  admissionNumber,
  photo,
  onChildSelect,
  showSelector = false,
  children,
}: StudentProfileCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex items-center gap-4">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-16 h-16 md:w-20 md:h-20  -full object-cover border-2 border-primary-200"
          />
        ) : (
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-8 h-8 md:w-10 md:h-10 text-primary-600" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{name}</h2>
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="font-medium">Class:</span> {className}
            </span>
            {rollNumber && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Roll:</span> {rollNumber}
              </span>
            )}
            {admissionNumber && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Admission:</span> {admissionNumber}
              </span>
            )}
          </div>
        </div>
        {showSelector && onChildSelect && (
          <button
            onClick={onChildSelect}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Change
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

