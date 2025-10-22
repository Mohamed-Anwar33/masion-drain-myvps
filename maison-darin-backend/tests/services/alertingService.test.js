const alertingService = require('../../services/alertingService');

describe('AlertingService', () => {
  beforeEach(() => {
    // Clear alert history before each test
    alertingService.alertHistory = [];
  });

  describe('Alert Sending', () => {
    test('should send alert and add to history', async () => {
      const alert = {
        type: 'TEST_ALERT',
        severity: 'warning',
        message: 'Test alert message',
        timestamp: new Date().toISOString()
      };

      await alertingService.sendAlert(alert);

      const history = alertingService.getAlertHistory(10);
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('TEST_ALERT');
      expect(history[0].severity).toBe('warning');
      expect(history[0].id).toBeDefined();
    });

    test('should handle alert sending errors gracefully', async () => {
      // Mock a channel that throws an error
      const mockChannel = {
        send: jest.fn().mockRejectedValue(new Error('Channel error'))
      };
      
      alertingService.alertChannels = [mockChannel];

      const alert = {
        type: 'TEST_ALERT',
        severity: 'error',
        message: 'Test alert',
        timestamp: new Date().toISOString()
      };

      // Should not throw error
      await expect(alertingService.sendAlert(alert)).resolves.toBeUndefined();
      
      // Alert should still be in history
      const history = alertingService.getAlertHistory(10);
      expect(history).toHaveLength(1);
    });
  });

  describe('Alert History', () => {
    test('should maintain alert history with limit', async () => {
      // Send multiple alerts
      for (let i = 0; i < 15; i++) {
        await alertingService.sendAlert({
          type: 'TEST_ALERT',
          severity: 'info',
          message: `Test alert ${i}`,
          timestamp: new Date().toISOString()
        });
      }

      const history = alertingService.getAlertHistory(10);
      expect(history).toHaveLength(10);
      
      // Should return most recent alerts first
      expect(history[0].message).toBe('Test alert 14');
    });

    test('should filter alerts by severity', async () => {
      await alertingService.sendAlert({
        type: 'ERROR_ALERT',
        severity: 'error',
        message: 'Error alert',
        timestamp: new Date().toISOString()
      });

      await alertingService.sendAlert({
        type: 'WARNING_ALERT',
        severity: 'warning',
        message: 'Warning alert',
        timestamp: new Date().toISOString()
      });

      const errorAlerts = alertingService.getAlertHistory(10, 'error');
      expect(errorAlerts).toHaveLength(1);
      expect(errorAlerts[0].severity).toBe('error');

      const warningAlerts = alertingService.getAlertHistory(10, 'warning');
      expect(warningAlerts).toHaveLength(1);
      expect(warningAlerts[0].severity).toBe('warning');
    });
  });

  describe('Alert Statistics', () => {
    test('should generate alert statistics', async () => {
      const now = new Date();
      
      // Send alerts with different severities and types
      await alertingService.sendAlert({
        type: 'ERROR_ALERT',
        severity: 'error',
        message: 'Error 1',
        timestamp: now.toISOString()
      });

      await alertingService.sendAlert({
        type: 'ERROR_ALERT',
        severity: 'error',
        message: 'Error 2',
        timestamp: now.toISOString()
      });

      await alertingService.sendAlert({
        type: 'WARNING_ALERT',
        severity: 'warning',
        message: 'Warning 1',
        timestamp: now.toISOString()
      });

      const stats = alertingService.getAlertStats();
      
      expect(stats.total).toBe(3);
      expect(stats.last24Hours).toBe(3);
      expect(stats.bySeverity.error).toBe(2);
      expect(stats.bySeverity.warning).toBe(1);
      expect(stats.byType.ERROR_ALERT).toBe(2);
      expect(stats.byType.WARNING_ALERT).toBe(1);
    });
  });

  describe('Alert ID Generation', () => {
    test('should generate unique alert IDs', () => {
      const id1 = alertingService.generateAlertId();
      const id2 = alertingService.generateAlertId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^alert_\d+_[a-z0-9]+$/);
    });
  });

  describe('Alert Channels', () => {
    test('should have default channels configured', () => {
      expect(alertingService.alertChannels.length).toBeGreaterThan(0);
      
      // Should have at least file channel
      const hasFileChannel = alertingService.alertChannels.some(
        channel => channel.constructor.name === 'FileAlertChannel'
      );
      expect(hasFileChannel).toBe(true);
    });
  });
});