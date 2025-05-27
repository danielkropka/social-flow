import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "Imię jest wymagane")
      .min(2, "Imię musi mieć minimum 2 znaki")
      .max(50, "Imię jest za długie")
      .regex(
        /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/,
        "Imię może zawierać tylko litery, spacje i myślniki"
      ),
    lastName: z
      .string()
      .min(1, "Nazwisko jest wymagane")
      .min(2, "Nazwisko musi mieć minimum 2 znaki")
      .max(50, "Nazwisko jest za długie")
      .regex(
        /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/,
        "Nazwisko może zawierać tylko litery, spacje i myślniki"
      ),
    email: z
      .string()
      .min(1, "Email jest wymagany")
      .email("Nieprawidłowy adres email")
      .max(255, "Email jest za długi"),
    password: z
      .string()
      .min(1, "Hasło jest wymagane")
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .max(100, "Hasło jest za długie")
      .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę")
      .regex(
        /[!@#$%^&*(),.?":{}|<>_\-+=/\\'`;~`]/,
        "Hasło musi zawierać przynajmniej jeden znak specjalny (!@#$%^&*(),.?\":{}|<>_-+=/\\'`;~`)"
      ),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
    terms: z
      .boolean()
      .refine((val) => val === true, "Musisz zaakceptować regulamin"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy adres email"),
  password: z
    .string()
    .min(1, "Hasło jest wymagane")
    .min(8, "Hasło musi mieć minimum 8 znaków"),
  remember: z.boolean().optional(),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
