'use client';

import { useState, useCallback } from 'react';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { auth } from '@/lib/firebase/config';

interface UseImageUploadOptions {
  onSuccess?: (url: string, metadata?: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
  maxRetries?: number;
  chunkSize?: number;
}

interface UploadResult {
  url: string;
  metadata: {
    fullPath: string;
    name: string;
    size: number;
    contentType: string;
    timeCreated: string;
  };
}

interface UseImageUploadReturn {
  uploadFile: (file: File, path: string) => Promise<UploadResult | null>;
  deleteFile: (path: string) => Promise<boolean>;
  progress: number;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    onSuccess,
    onError,
    onProgress,
    maxRetries = 3,
    chunkSize = 256 * 1024 // 256KB chunks
  } = options;

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  const uploadFile = useCallback(async (file: File, path: string): Promise<UploadResult | null> => {
    if (!auth?.currentUser) {
      const errorMsg = 'Usuário não autenticado';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        const storage = getStorage();
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const fullPath = `${path}/${fileName}`;
        const storageRef = ref(storage, fullPath);

        // Criar task de upload com configurações otimizadas
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
          cacheControl: 'public,max-age=31536000', // 1 ano de cache
          customMetadata: {
            uploadedBy: auth.currentUser.uid,
            uploadedAt: new Date().toISOString(),
            originalName: file.name,
            originalSize: file.size.toString()
          }
        });

        // Promise para aguardar conclusão
        const result = await new Promise<UploadResult>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Atualizar progresso
              const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(progressPercent);
              onProgress?.(progressPercent);

              // Log de progresso para debugging
              if (process.env.NODE_ENV === 'development') {
                console.debug(`Upload progress: ${progressPercent.toFixed(1)}%`);
              }
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              // Upload completo
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const metadata = uploadTask.snapshot.metadata;
                
                resolve({
                  url: downloadURL,
                  metadata: {
                    fullPath: metadata.fullPath,
                    name: metadata.name,
                    size: metadata.size,
                    contentType: metadata.contentType || file.type,
                    timeCreated: metadata.timeCreated
                  }
                });
              } catch (urlError) {
                reject(urlError);
              }
            }
          );
        });

        // Upload bem-sucedido
        setProgress(100);
        setIsUploading(false);
        onSuccess?.(result.url, result.metadata);
        
        return result;

      } catch (uploadError: any) {
        console.error(`Upload attempt ${retries + 1} failed:`, uploadError);
        
        retries++;
        
        if (retries <= maxRetries) {
          // Esperar antes de tentar novamente (exponential backoff)
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Reset progress para nova tentativa
          setProgress(0);
          continue;
        }
        
        // Todas as tentativas falharam
        const errorMessage = getErrorMessage(uploadError);
        setError(errorMessage);
        setIsUploading(false);
        onError?.(errorMessage);
        
        return null;
      }
    }

    return null;
  }, [auth, onSuccess, onError, onProgress, maxRetries]);

  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    if (!auth?.currentUser) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      const storage = getStorage();
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
      
      return true;
    } catch (deleteError: any) {
      console.error('Delete error:', deleteError);
      const errorMessage = getErrorMessage(deleteError);
      setError(errorMessage);
      
      return false;
    }
  }, [auth]);

  return {
    uploadFile,
    deleteFile,
    progress,
    isUploading,
    error,
    reset
  };
}

/**
 * Converte erros do Firebase Storage em mensagens amigáveis
 */
function getErrorMessage(error: { code?: string; message?: string } | Error): string {
  if ('code' in error && error?.code) {
    switch (error.code) {
      case 'storage/unauthorized':
        return 'Você não tem permissão para fazer upload';
      
      case 'storage/canceled':
        return 'Upload foi cancelado';
      
      case 'storage/invalid-format':
        return 'Formato de arquivo inválido';
      
      case 'storage/invalid-argument':
        return 'Argumentos inválidos para upload';
      
      case 'storage/no-default-bucket':
        return 'Configuração de storage não encontrada';
      
      case 'storage/object-not-found':
        return 'Arquivo não encontrado';
      
      case 'storage/project-not-found':
        return 'Projeto Firebase não configurado';
      
      case 'storage/quota-exceeded':
        return 'Cota de storage excedida';
      
      case 'storage/server-file-wrong-size':
        return 'Tamanho do arquivo inconsistente';
      
      case 'storage/unauthenticated':
        return 'Usuário não autenticado';
      
      case 'storage/unknown':
        return 'Erro desconhecido no servidor';
      
      case 'storage/retry-limit-exceeded':
        return 'Muitas tentativas de upload. Tente novamente mais tarde';
        
      default:
        return error.message || 'Erro durante upload';
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Erro desconhecido durante upload';
}

/**
 * Hook especializado para avatars de usuário
 */
export function useAvatarUpload(userId: string, options: UseImageUploadOptions = {}) {
  const baseUpload = useImageUpload(options);

  const uploadAvatar = useCallback(async (file: File) => {
    // Validações específicas para avatar
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const error = 'Avatar deve ter no máximo 5MB';
      baseUpload.reset();
      options.onError?.(error);
      return null;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const error = 'Formato não suportado. Use JPEG, PNG ou WebP';
      baseUpload.reset();
      options.onError?.(error);
      return null;
    }

    return baseUpload.uploadFile(file, `avatars/${userId}`);
  }, [userId, baseUpload, options]);

  return {
    ...baseUpload,
    uploadAvatar
  };
}

/**
 * Utilitários para manipulação de imagens
 */
export const imageUtils = {
  /**
   * Redimensiona uma imagem mantendo aspect ratio
   */
  async resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Falha ao redimensionar imagem'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * Comprime uma imagem reduzindo qualidade
   */
  async compressImage(file: File, quality: number = 0.7): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Falha ao comprimir imagem'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * Converte imagem para WebP (formato mais eficiente)
   */
  async convertToWebP(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const fileName = file.name.replace(/\.[^/.]+$/, '.webp');
              const webpFile = new File([blob], fileName, {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(webpFile);
            } else {
              reject(new Error('Falha ao converter para WebP'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }
};