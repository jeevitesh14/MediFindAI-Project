package com.medifindai.dto.auth;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RegisterRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "dadi",
        "dadi123",
        "123456",
        "shashaank",
        "user123",
        "pharmacy",
        "MediFind",
        "2026"
    })
    void validPasswords_shouldPassValidation(String password) {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Valid User");
        request.setEmail("user@example.com");
        request.setPhone("9876543210");
        request.setPassword(password);

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "abc@123",       // contains special char '@'
        "password!123",  // contains special char '!'
        "dadi#99",       // contains special char '#'
        "pass word",     // contains whitespace
        ""               // blank
    })
    void invalidPasswords_shouldFailValidation(String password) {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Valid User");
        request.setEmail("user@example.com");
        request.setPhone("9876543210");
        request.setPassword(password);

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("password"));
    }

    @Test
    void missingPhone_shouldFailValidation_whenNull() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Valid User");
        request.setEmail("user@example.com");
        request.setPassword("validPass123");
        request.setPhone(null);

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("phone") &&
                v.getMessage().contains("Phone number is required"));
    }

    @Test
    void missingPhone_shouldFailValidation_whenBlank() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Valid User");
        request.setEmail("user@example.com");
        request.setPassword("validPass123");
        request.setPhone("   ");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("phone"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "12345",          // too short (5 digits)
        "987654321",      // 9 digits
        "98765432101",    // 11 digits without +91
        "abcdefghij",     // letters
        "phone12345",     // alphanumeric
        "+91 12345"       // prefix with too few digits
    })
    void malformedPhone_shouldFailValidation(String phone) {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Valid User");
        request.setEmail("user@example.com");
        request.setPassword("validPass123");
        request.setPhone(phone);

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("phone"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "9876543210",
        "9000000001",
        "+919876543210",
        "+91 9876543210",
        "+91-9876543210"
    })
    void validPhone_shouldPassValidation(String phone) {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Valid User");
        request.setEmail("user@example.com");
        request.setPassword("validPass123");
        request.setPhone(phone);

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }
}
