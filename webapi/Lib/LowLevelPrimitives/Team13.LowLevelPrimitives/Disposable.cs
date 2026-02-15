using System;

namespace Team13.LowLevelPrimitives;

public class Disposable : IDisposable
{
    private readonly Action _action;

    public Disposable(Action action)
    {
        _action = action;
    }

    public void Dispose()
    {
        _action();
    }
}
