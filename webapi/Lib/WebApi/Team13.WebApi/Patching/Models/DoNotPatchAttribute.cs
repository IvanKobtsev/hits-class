using System;

namespace Team13.WebApi.Patching.Models;

/// <summary>
/// Decorate properties that you don't want to be automatically copied to destination class during patching
/// </summary>
public class DoNotPatchAttribute : Attribute { }
