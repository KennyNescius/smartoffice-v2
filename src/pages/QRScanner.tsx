import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, AlertCircle } from 'lucide-react';

export const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      false
    );

    scanner.render(
      (decodedText) => {
        // Assuming the QR code contains the asset ID
        scanner.clear();
        navigate(`/assets/${decodedText}`);
      },
      (err) => {
        // Ignore scan errors as they happen continuously when no QR is in frame
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <div className="p-3 bg-indigo-100 rounded-full">
          <QrCode className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Сканер QR-кодов</h1>
        <p className="text-sm text-slate-500">
          Наведите камеру на QR-код актива для просмотра информации
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
        <div id="qr-reader" className="w-full"></div>
      </div>
    </div>
  );
};
