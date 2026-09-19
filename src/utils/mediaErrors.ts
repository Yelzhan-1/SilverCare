/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Produces a clear, actionable Russian-language error message for camera/microphone
 * access failures, tailored for elderly users. Instead of raw browser errors like
 * "microphone access failed", we tell them exactly what happened and what to do.
 */
export type MediaKind = 'camera' | 'microphone';

export function getMediaErrorMessage(err: unknown, kind: MediaKind): string {
  const device = kind === 'camera' ? 'камере' : 'микрофону';
  const deviceCap = kind === 'camera' ? 'Камера' : 'Микрофон';
  const name = (err as { name?: string } | undefined)?.name || '';

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return `Доступ к ${device} запрещён. Разрешите доступ: нажмите на значок замка 🔒 рядом с адресом сайта в браузере → «Разрешить» для ${kind === 'camera' ? 'камеры' : 'микрофона'} → обновите страницу.`;
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return `${deviceCap} не найдена на этом устройстве. Проверьте подключение и попробуйте ещё раз.`;
    case 'NotReadableError':
    case 'TrackStartError':
      return `Не удалось получить доступ — похоже, ${device === 'камере' ? 'камера' : 'микрофон'} уже используется другим приложением. Закройте его и попробуйте снова.`;
    case 'OverconstrainedError':
      return `${deviceCap} не поддерживает нужные настройки. Попробуйте другое устройство.`;
    case 'SecurityError':
      return `Браузер заблокировал доступ к ${device} по соображениям безопасности. Откройте сайт по защищённому адресу (https).`;
    default:
      return `Не удалось включить ${kind === 'camera' ? 'камеру' : 'микрофон'}. Проверьте разрешения браузера и попробуйте ещё раз.`;
  }
}
