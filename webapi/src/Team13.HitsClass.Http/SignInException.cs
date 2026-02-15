using System;

namespace Team13.HitsClass.Http;

public class SignInException : Exception
{
    public SignInException(string stringContent)
        : base(stringContent) { }
}
