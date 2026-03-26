import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react';

export const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  const startCamera = async () => {
    if (!scannerRef.current) return;
    if (scannerRef.current.isScanning) return;
    
    try {
      setIsScanning(true);
      setError(null);
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(console.error);
          }
          if (mountedRef.current) {
            // QR may contain full URL (https://.../assets/id) or just the id
            const match = decodedText.match(/\/assets\/(.+)$/);
            const assetId = match ? match[1] : decodedText;
            navigate(`/assets/${assetId}`);
          }
        },
        (err) => {
          // ignore
        }
      );
    } catch (err) {
      console.error(err);
      if (mountedRef.current) {
        setError("Не удалось получить доступ к камере. Вы можете загрузить фото из галереи.");
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    scannerRef.current = new Html5Qrcode('qr-reader');
    
    startCamera();

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(console.error);
        } else {
          scannerRef.current.clear();
        }
      }
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!scannerRef.current) return;
    
    try {
      setError(null);
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop().catch(console.error);
        setIsScanning(false);
      }
      
      const decodedText = await scannerRef.current.scanFile(file, true);
      const match = decodedText.match(/\/assets\/(.+)$/);
      const assetId = match ? match[1] : decodedText;
      navigate(`/assets/${assetId}`);
    } catch (err) {
      setError("QR-код не найден на изображении. Попробуйте другое фото.");
      startCamera(); // Restart camera if failed
    }
    
    e.target.value = '';
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <div className="p-3 bg-indigo-100 rounded-full">
          <QrCode className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Сканер QR-кодов</h1>
        <p className="text-sm text-slate-500">
          Наведите камеру на QR-код актива или загрузите фото
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 space-y-4">
        <div id="qr-reader" className="w-full overflow-hidden rounded-lg"></div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {!isScanning && (
            <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>Включить камеру</span>
            </button>
          )}
          
          <label className="flex-1 flex items-center justify-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <ImageIcon className="w-5 h-5" />
            <span>Загрузить фото</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
