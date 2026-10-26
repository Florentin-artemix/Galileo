package com.galileo.users;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.users.controller.UserProfileController;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class UserProfileDataIsolationTest {

    @Test
    void favoriteListCannotBeReadForAnotherUser() {
        UserProfileController controller = new UserProfileController(null, null, null, null, null, null);
        CustomUserDetails currentUser = new CustomUserDetails(User.builder()
                .id(101L)
                .email("reader@example.org")
                .role(Role.STUDENT)
                .build());

        assertThrows(ForbiddenException.class, () -> controller.getFavorites("202", currentUser));
    }

    @Test
    void readingHistoryCannotBeReadForAnotherUser() {
        UserProfileController controller = new UserProfileController(null, null, null, null, null, null);
        CustomUserDetails currentUser = new CustomUserDetails(User.builder()
                .id(101L)
                .email("reader@example.org")
                .role(Role.STUDENT)
                .build());

        assertThrows(ForbiddenException.class,
                () -> controller.getReadingHistoryPaginated("202", 0, 20, currentUser));
    }
}
