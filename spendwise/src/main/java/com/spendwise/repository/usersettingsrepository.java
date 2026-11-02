
package com.spendwise.repository;

import com.spendwise.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepository
        extends JpaRepository<UserSettings, Long> {
}
