package com.galileo.ecriture.repository;

import com.galileo.ecriture.entity.User;
import com.galileo.ecriture.security.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUid(String uid);
    Optional<User> findByEmail(String email);
    boolean existsByUid(String uid);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByRoleIn(List<Role> roles);
}


