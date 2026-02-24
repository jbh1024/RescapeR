using RescapeR.Data;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace RescapeR.Gameplay
{
    public class WeaponController : MonoBehaviour
    {
        [SerializeField] private WeaponData equippedWeapon;
        [SerializeField] private Transform attackOrigin;
        [SerializeField] private float attackRange = 1.4f;
        [SerializeField] private LayerMask enemyLayer;

        private float lastAttackTime;

        public WeaponData EquippedWeapon => equippedWeapon;

        public void Equip(WeaponData data)
        {
            equippedWeapon = data;
        }

        private void Update()
        {
            if (equippedWeapon == null)
            {
                return;
            }

#if ENABLE_INPUT_SYSTEM
            if (equippedWeapon.supportsAutoFire && Keyboard.current != null && Keyboard.current.spaceKey.isPressed)
            {
                TryAttack(false);
            }
            else if (Keyboard.current != null && Keyboard.current.spaceKey.wasPressedThisFrame)
            {
                TryAttack(false);
            }
#else
            if (Input.GetKeyDown(KeyCode.Space))
            {
                TryAttack(false);
            }
#endif
        }

#if ENABLE_INPUT_SYSTEM
        public void OnAttack(InputAction.CallbackContext context)
        {
            if (context.performed)
            {
                TryAttack(false);
            }
        }
#endif

        public void TryAttack(bool isBackstab)
        {
            var interval = 1f / Mathf.Max(0.01f, equippedWeapon.attackSpeed);
            if (Time.time < lastAttackTime + interval)
            {
                return;
            }

            lastAttackTime = Time.time;
            var damage = CalculateDamage(isBackstab);
            var hitCenter = attackOrigin != null ? attackOrigin.position : transform.position;
            var hits = Physics2D.OverlapCircleAll(hitCenter, attackRange, enemyLayer);

            foreach (var hit in hits)
            {
                if (hit.TryGetComponent<IDamageable>(out var damageable))
                {
                    damageable.ApplyDamage(damage, equippedWeapon.breaksSuperArmor);
                }
            }

            if (equippedWeapon.rangedReturnAttack)
            {
                Debug.Log("[WeaponController] Ranged return attack triggered.");
            }
        }

        private int CalculateDamage(bool isBackstab)
        {
            var damage = equippedWeapon.baseDamage;

            if (isBackstab)
            {
                damage *= Mathf.Max(1f, equippedWeapon.backstabMultiplier);
            }

            if (Random.value <= equippedWeapon.critChance)
            {
                damage *= 1.5f;
            }

            return Mathf.RoundToInt(damage);
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.cyan;
            var center = attackOrigin != null ? attackOrigin.position : transform.position;
            Gizmos.DrawWireSphere(center, attackRange);
        }
    }

    public interface IDamageable
    {
        void ApplyDamage(int amount, bool breakSuperArmor);
    }
}
