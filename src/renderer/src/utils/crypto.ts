import CryptoJS from 'crypto-js'

/**
 * AES 解密工具类
 * 参考Dart实现，使用ECB模式
 */
export class AESDecryption {
  // AES加密密钥 - 与Dart版本保持一致
  private static readonly AES_KEY = 'KL20250417888888'

  /**
   * 自动检测并解密数据
   * @param encryptedData 加密的数据
   * @returns 解密后的字符串，失败返回null
   */
  static decryptAuto(encryptedData: string): string | null {
    try {
      // 首先尝试Base64解密
      const base64Result = this.decryptBase64(encryptedData)
      if (base64Result) {
        return base64Result
      }

      // 然后尝试十六进制解密
      const hexResult = this.decryptHex(encryptedData)
      if (hexResult) {
        return hexResult
      }

      return null
    } catch (error) {
      console.error('[AES解密] 自动解密失败:', error)
      return null
    }
  }

  /**
   * 解密Base64编码的字符串
   * @param encryptedBase64 Base64编码的加密字符串
   * @returns 解密后的字符串
   */
  static decryptBase64(encryptedBase64: string): string | null {
    try {
      const key = CryptoJS.enc.Utf8.parse(this.AES_KEY)
      
      const decrypted = CryptoJS.AES.decrypt(encryptedBase64, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      })

      const result = decrypted.toString(CryptoJS.enc.Utf8)
      return result || null
    } catch (error) {
      // console.error('[AES解密] Base64解密失败:', error)
      return null
    }
  }

  /**
   * 解密十六进制字符串
   * @param encryptedHex 十六进制编码的加密字符串
   * @returns 解密后的字符串
   */
  static decryptHex(encryptedHex: string): string | null {
    try {
      // 将十六进制字符串转换为字节数组
      const bytes: number[] = []
      for (let i = 0; i < encryptedHex.length; i += 2) {
        const hex = encryptedHex.substring(i, i + 2)
        bytes.push(parseInt(hex, 16))
      }
      
      return this.decryptBytes(bytes)
    } catch (error) {
      // console.error('[AES解密] 十六进制解密失败:', error)
      return null
    }
  }

  /**
   * 解密字节数组
   * @param encryptedBytes 加密的字节数组
   * @returns 解密后的字符串
   */
  static decryptBytes(encryptedBytes: number[]): string | null {
    try {
      const key = CryptoJS.enc.Utf8.parse(this.AES_KEY)
      
      // 将字节数组转换为WordArray
      const encryptedWordArray = CryptoJS.lib.WordArray.create(new Uint8Array(encryptedBytes))
      const encrypted = CryptoJS.lib.CipherParams.create({
        ciphertext: encryptedWordArray
      })
      
      // 解密
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      })

      const result = decrypted.toString(CryptoJS.enc.Utf8)
      return result || null
    } catch (error) {
      // console.error('[AES解密] 字节数组解密失败:', error)
      return null
    }
  }

  /**
   * 检查字符串是否可能是加密数据
   * @param data 要检查的字符串
   * @returns 是否可能是加密数据
   */
  static isLikelyEncrypted(data: string): boolean {
    // 检查是否为Base64格式
    if (/^[A-Za-z0-9+/]*={0,2}$/.test(data) && data.length > 16) {
      return true
    }

    // 检查是否为十六进制格式
    if (/^[0-9A-Fa-f]+$/.test(data) && data.length > 32) {
      return true
    }

    return false
  }

  /**
   * 检查数据是否已经是JSON格式
   * @param data 要检查的数据
   * @returns 是否是JSON格式
   */
  static isJsonData(data: any): boolean {
    if (typeof data === 'object' && data !== null) {
      return true
    }

    if (typeof data === 'string') {
      try {
        JSON.parse(data)
        return true
      } catch {
        return false
      }
    }

    return false
  }
} 