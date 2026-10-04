import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from '@capacitor/local-notifications';

export const nativeService = {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  async init(): Promise<void> {
    if (!this.isNative()) return;

    try {
      // Configure immersive Status Bar
      await StatusBar.setStyle({ style: Style.Light });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#f8fafc' });
      }

      // Request and setup evening reminder (8:30 PM)
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display === 'granted') {
        await this.scheduleDailyReminder();
      }
    } catch (err) {
      console.warn('Native init error:', err);
    }
  },

  async triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light'): Promise<void> {
    try {
      if (this.isNative()) {
        if (type === 'light') {
          await Haptics.impact({ style: ImpactStyle.Light });
        } else if (type === 'medium') {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } else if (type === 'success') {
          await Haptics.notification({ type: NotificationType.Success });
        } else if (type === 'warning') {
          await Haptics.notification({ type: NotificationType.Warning });
        }
      } else if (navigator.vibrate) {
        navigator.vibrate(type === 'success' ? [50, 50, 50] : 30);
      }
    } catch {}
  },

  async takePhoto(): Promise<string | null> {
    if (!this.isNative()) return null;

    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      return image.dataUrl || null;
    } catch (err: any) {
      // User cancelled
      if (err.message?.includes('cancelled')) return null;
      console.error('Camera error:', err);
      throw err;
    }
  },

  async pickPhoto(): Promise<string | null> {
    if (!this.isNative()) return null;

    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      return image.dataUrl || null;
    } catch (err: any) {
      if (err.message?.includes('cancelled')) return null;
      console.error('Pick photo error:', err);
      throw err;
    }
  },

  async scheduleDailyReminder(): Promise<void> {
    try {
      // Cancel previous reminder first
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });

      // Daily reminder at 20:30 (8:30 PM)
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1001,
            title: '🧾 今天有發票要記帳嗎？',
            body: '拍照掃描 3 秒自動分類，記錄你的美好生活成分！☕✨',
            schedule: {
              on: {
                hour: 20,
                minute: 30,
              },
              allowWhileIdle: true,
            },
          },
        ],
      });
    } catch (err) {
      console.warn('Schedule reminder failed:', err);
    }
  },
};
