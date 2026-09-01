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
        request.setPassword(password);

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("password"));
    }
}
