
package com.spendwise.service;

import com.spendwise.entity.UserSettings;
import com.spendwise.repository.UserSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;

    public UserSettingsService(
            UserSettingsRepository userSettingsRepository) {
        this.userSettingsRepository = userSettingsRepository;
    }

    @Transactional(readOnly = true)
    public Optional<UserSettings> getSettingsByUserId(Long userId) {
        return userSettingsRepository.findById(userId);
    }

    @Transactional
    public UserSettings saveSettings(UserSettings settings) {
        return userSettingsRepository.save(settings);
    }
}
