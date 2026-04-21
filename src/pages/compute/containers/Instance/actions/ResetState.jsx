import { ConfirmAction } from 'containers/Action';
import globalServerStore from 'stores/nova/instance';

/**
 * Reset the state of the instance to active and reboot the instance
 */
export class ResetState extends ConfirmAction {
  policy = 'os_compute_api:os-admin-actions:reset_state';

  allowedCheckFunc = () => {
    return !!this.containerProps?.rootStore?.hasAdminRole;
  };

  get id() {
    return 'reset-state';
  }

  get title() {
    return t('Reset State');
  }

  get buttonText() {
    return t('Reset State');
  }

  get actionName() {
    return t('reset state');
  }

  get isDanger() {
    return true;
  }

  onSubmit = async (item) => {
    const { id } = item || this.item;
    try {
      await globalServerStore.resetState({ id, state: 'active' });
    } catch (error) {
      throw new Error(
        t(
          'Failed to reset instance state to active. Hard reboot is not triggered.'
        )
      );
    }
    try {
      return await globalServerStore.reboot({ id });
    } catch (error) {
      throw new Error(
        t('Instance state was reset to active, but hard reboot failed.')
      );
    }
  };
}
