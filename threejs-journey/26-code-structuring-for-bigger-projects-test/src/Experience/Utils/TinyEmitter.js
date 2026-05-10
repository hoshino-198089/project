/**
 * TinyEmitter
 *
 * Three.js やブラウザアプリ向けの
 * 軽量イベントエミッター
 *
 * 特徴
 * - on / off / emit / once 対応
 * - namespace 対応
 * - cleanup function 対応
 * - callback エラー分離
 * - Map ベースの管理
 * - 外部ライブラリ不要
 *
 * 使用例
 *
 * const emitter = new TinyEmitter()
 *
 * const cleanup = emitter.on('resize.ui', (payload) => {
 *   console.log(payload.width)
 * })
 *
 * emitter.emit('resize', { width: 1920 })
 *
 * cleanup()
 */

export default class TinyEmitter {
  /**
   * イベントを保持する Map
   *
   * 構造:
   *
   * Map {
   *   'resize' => [
   *     {
   *       callback: fn,
   *       namespace: 'ui',
   *       once: false
   *     }
   *   ]
   * }
   */
  #events = new Map()

  /**
   * イベント登録
   *
   * @param {string} eventName
   * @param {(payload:any)=>void} callback
   *
   * @returns {() => void}
   * cleanup function
   *
   * 使用例:
   *
   * const cleanup = emitter.on('resize', () => {})
   *
   * cleanup()
   */
  on(eventName, callback) {
    // eventName が文字列でない場合はエラー
    if (typeof eventName !== 'string') {
      throw new TypeError('Event name must be a string')
    }

    // callback が関数でない場合はエラー
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function')
    }

    // "resize.ui"
    // ↓
    // {
    //   event: 'resize',
    //   namespace: 'ui'
    // }
    const { event, namespace } = this.#parse(eventName)

    // event が未登録なら初期化
    if (!this.#events.has(event)) {
      this.#events.set(event, [])
    }

    // event に紐づく listener 配列取得
    const listeners = this.#events.get(event)

    // listener 情報作成
    const listener = {
      callback,
      namespace,
      once: false
    }

    // listener 追加
    listeners.push(listener)

    // cleanup function を返す
    return () => {
      this.off(eventName, callback)
    }
  }

  /**
   * 一度だけ実行されるイベント登録
   *
   * emit 後に自動削除される
   */
  once(eventName, callback) {
    const { event, namespace } = this.#parse(eventName)

    if (!this.#events.has(event)) {
      this.#events.set(event, [])
    }

    const listeners = this.#events.get(event)

    const listener = {
      callback,
      namespace,
      once: true
    }

    listeners.push(listener)

    return () => {
      this.off(eventName, callback)
    }
  }

  /**
   * イベント解除
   *
   * 使用例:
   *
   * off('resize')
   * -> resize を全削除
   *
   * off('resize.ui')
   * -> resize の ui namespace のみ削除
   *
   * off('.ui')
   * -> ui namespace を全削除
   *
   * off('resize', callback)
   * -> 特定 callback のみ削除
   */
  off(eventName, callback) {
    if (typeof eventName !== 'string') {
      throw new TypeError('Event name must be a string')
    }

    /**
     * namespace 単体削除
     *
     * ".ui"
     */
    if (eventName.startsWith('.')) {
      const namespace = eventName.slice(1)

      // 全 event をループ
      for (const [event, listeners] of this.#events.entries()) {
        // namespace が一致しない listener を残す
        const filtered = listeners.filter((listener) => {
          const namespaceMatch = listener.namespace !== namespace

          const callbackMatch =
            !callback || listener.callback !== callback

          return namespaceMatch || callbackMatch
        })

        // listener が空なら event ごと削除
        if (filtered.length === 0) {
          this.#events.delete(event)
        } else {
          this.#events.set(event, filtered)
        }
      }

      return
    }

    // 通常 event 解析
    const { event, namespace } = this.#parse(eventName)

    // event 未登録なら終了
    if (!this.#events.has(event)) {
      return
    }

    const listeners = this.#events.get(event)

    /**
     * 削除対象以外を残す
     */
    const filtered = listeners.filter((listener) => {
      const namespaceMatch =
        !namespace || listener.namespace === namespace

      const callbackMatch =
        !callback || listener.callback === callback

      // namespace と callback が一致したものを削除
      return !(namespaceMatch && callbackMatch)
    })

    // 空なら event ごと削除
    if (filtered.length === 0) {
      this.#events.delete(event)
    } else {
      this.#events.set(event, filtered)
    }
  }

  /**
   * イベント発火
   *
   * 使用例:
   *
   * emit('resize', {
   *   width: 1920,
   *   height: 1080
   * })
   */
  emit(eventName, payload = undefined) {
    if (typeof eventName !== 'string') {
      throw new TypeError('Event name must be a string')
    }

    const { event } = this.#parse(eventName)

    const listeners = this.#events.get(event)

    // listener が無ければ終了
    if (!listeners || listeners.length === 0) {
      return
    }

    /**
     * 配列 clone
     *
     * callback 実行中に
     * off() が呼ばれても安全にする
     */
    for (const listener of [...listeners]) {
      try {
        // callback 実行
        listener.callback(payload)
      } catch (error) {
        // callback エラーを隔離
        // 他 listener を止めない
        console.error(
          `[TinyEmitter] Error in "${event}" listener`,
          error
        )
      }

      /**
       * once listener は自動削除
       */
      if (listener.once) {
        this.off(
          listener.namespace
            ? `${event}.${listener.namespace}`
            : event,
          listener.callback
        )
      }
    }
  }

  /**
   * 全イベント削除
   */
  clear() {
    this.#events.clear()
  }

  /**
   * listener 数確認
   *
   * デバッグ用
   */
  listenerCount(eventName) {
    const { event } = this.#parse(eventName)

    return this.#events.get(event)?.length ?? 0
  }

  /**
   * eventName 解析
   *
   * "resize.ui"
   * ↓
   * {
   *   event: 'resize',
   *   namespace: 'ui'
   * }
   */
  #parse(input) {
    const [event, namespace] = input.split('.')

    return {
      event,
      namespace: namespace || null
    }
  }
}
