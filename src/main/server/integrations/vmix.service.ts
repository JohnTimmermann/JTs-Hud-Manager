import { getSettings } from '../domains/settings/settings.routes'

export class VmixService {
  /**
   * Sends a command to the/vmix API.
   *
   * @param functionName The vMix API function name (e.g., 'Cut', 'OverlayInput1')
   * @param input Optional input name or number
   * @param value Optional value string
   */
  public async sendVmixCommand(functionName: string, input?: string, value?: string): Promise<boolean> {
    try {
      const settings = await getSettings()
      
      if (!settings.vmixHost || !settings.vmixPort) {
        console.warn('[vMix] Host or port not configured.')
        return false
      }

      const baseUrl = `http://${settings.vmixHost}:${settings.vmixPort}/api/`
      const url = new URL(baseUrl)
      
      url.searchParams.append('Function', functionName)
      
      if (input) {
        url.searchParams.append('Input', input)
      }
      
      if (value) {
        url.searchParams.append('Value', value)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        console.error(`[vMix] API responded with status ${response.status}: ${response.statusText}`)
        return false
      }

      return true
    } catch (err) {
      console.error('[vMix] Failed to send command:', err)
      return false
    }
  }

  /**
   * Executes a vMix mapping action, and optionally reverts it after a delay.
   *
   * @param mapping Action mapping configuration
   */
  public async executeAction(action: { function: string; input?: string; duration?: number }): Promise<void> {
    const success = await this.sendVmixCommand(action.function, action.input)
    if (success && action.duration) {
      setTimeout(() => {
        // Simple revert logic: if it was an OverlayInput, we toggle it again
        if (action.function.startsWith('OverlayInput')) {
          this.sendVmixCommand(action.function, action.input).catch(console.error)
        }
      }, action.duration)
    }
  }
}

export const vmixService = new VmixService()