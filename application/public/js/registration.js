document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const email = document.getElementById('email');

    // Real-time validation for username
    username.addEventListener('input', validateUsername);

    // Real-time validation for password
    password.addEventListener('input', validatePassword);

    // Real-time validation for confirm password
    confirmPassword.addEventListener('input', validateConfirmPassword);

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            alert('Form submitted successfully!');
            form.reset();
            // You can add code here to actually submit the form
        }
    });
});

function validateUsername() {
    const username = document.getElementById('username');
    const usernameError = document.getElementById('usernameError');
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]{2,}$/;

    if (!usernameRegex.test(username.value)) {
        usernameError.textContent = 'Username must start with a letter and be at least 3 alphanumeric characters long.';
        return false;
    } else {
        usernameError.textContent = '';
        return true;
    }
}

function validatePassword() {
    const password = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[/*\-+!@#$^&~\[\]])[A-Za-z\d/*\-+!@#$^&~\[\]]{8,}$/;

    if (!passwordRegex.test(password.value)) {
        passwordError.textContent = 'Password must be at least 8 characters long, contain 1 uppercase letter, 1 number, and 1 special character (/*-+!@#$^&~[]).';
        return false;
    } else {
        passwordError.textContent = '';
        return true;
    }
}

function validateConfirmPassword() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    if (password.value !== confirmPassword.value) {
        confirmPasswordError.textContent = 'Passwords do not match.';
        return false;
    } else {
        confirmPasswordError.textContent = '';
        return true;
    }
}

function validateForm() {
    let isValid = true;

    isValid = validateUsername() && isValid;
    isValid = validatePassword() && isValid;
    isValid = validateConfirmPassword() && isValid;

    // Email validation is handled by HTML5 type="email"
    // Age and TOS checkboxes are handled by HTML5 required attribute

    return isValid;
}